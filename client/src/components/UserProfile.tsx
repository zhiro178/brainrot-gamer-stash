import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Upload, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";

interface UserProfileProps {
  user: any;
  onUserUpdate?: (updatedUser: any) => void;
}

export const UserProfile = ({ user, onUserUpdate }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [profilePicture, setProfilePicture] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadedProfile, setLoadedProfile] = useState<any>(null);
  const { toast } = useToast();

  const isVerified = user?.email_confirmed_at !== null;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Try to load from database first
        const { data: profileData, error } = await workingSupabase
          .from('user_profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', user.id);

        if (!error && profileData && profileData.length > 0) {
          console.log('Loaded profile from database:', profileData[0]);
          setLoadedProfile(profileData[0]);
          setUsername(profileData[0].username || profileData[0].display_name || '');
          setProfilePicture(profileData[0].avatar_url || '');
          return;
        }

        // Fallback to user metadata
        setUsername(user?.user_metadata?.username || '');
        setProfilePicture(user?.user_metadata?.avatar_url || '');
      } catch (error) {
        console.error('Error loading profile:', error);
        // Use user metadata on error
        setUsername(user?.user_metadata?.username || '');
        setProfilePicture(user?.user_metadata?.avatar_url || '');
      }
    };

    loadUserProfile();
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for simple storage in user metadata
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setProfilePicture(base64);
        setIsUploading(false);
        
        toast({
          title: "Image uploaded",
          description: "Click 'Save Changes' to update your profile",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!isVerified) {
      toast({
        title: "Account not verified",
        description: "Please verify your email first",
        variant: "destructive",
      });
      return;
    }

    if (username.trim().length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Check if profile exists in database
      const { data: existingProfile, error: checkError } = await workingSupabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user?.id);
        
      if (checkError) {
        throw new Error(`Database check failed: ${checkError.message}`);
      }
      
      const profileData = {
        user_id: user?.id,
        username: username.trim(),
        display_name: username.trim(),
        avatar_url: profilePicture || null
      };
      
      if (existingProfile && existingProfile.length > 0) {
        // Update existing profile
        const { error: updateError } = await workingSupabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user?.id);
          
        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }
      } else {
        // Insert new profile
        const { error: insertError } = await workingSupabase
          .from('user_profiles')
          .insert([profileData]);
          
        if (insertError) {
          throw new Error(`Insert failed: ${insertError.message}`);
        }
      }

      console.log('Profile saved successfully to database');

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully",
      });

      if (onUserUpdate) {
        // Create updated user object to trigger app-wide updates
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user?.user_metadata,
            username: username.trim(),
            display_name: username.trim(),
            avatar_url: profilePicture
          }
        };
        onUserUpdate(updatedUser);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const resendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Check your email for the verification link",
      });
    } catch (error) {
      console.error('Resend error:', error);
      const errorInfo = handleSupabaseError(error, "Failed to send verification email");
      toast(errorInfo);
    }
  };

  const getUserDisplayName = () => {
    // Use loaded profile data first
    if (loadedProfile?.display_name) {
      return loadedProfile.display_name;
    }
    if (loadedProfile?.username) {
      return loadedProfile.username;
    }
    
    // Fallback to user metadata
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={loadedProfile?.avatar_url || user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">{getUserDisplayName()}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Account Status
                {isVerified ? (
                  <Badge className="bg-gaming-success text-black">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Email: {user?.email}
              </p>
              {!isVerified && (
                <div className="space-y-3">
                  <p className="text-sm text-gaming-warning">
                    Please verify your email to upload profile pictures and set a custom username.
                  </p>
                  <Button onClick={resendVerification} variant="outline" size="sm">
                    Resend Verification Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profilePicture} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={!isVerified || isUploading}
                  className="hidden"
                  id="profile-upload"
                />
                <Button
                  onClick={() => document.getElementById('profile-upload')?.click()}
                  disabled={!isVerified || isUploading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {!isVerified && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Verify your email to upload
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isVerified}
              placeholder="Enter your username"
              className="bg-background border-primary/20"
            />
            {!isVerified && (
              <p className="text-xs text-muted-foreground">
                Verify your email to set a custom username
              </p>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveProfile}
            disabled={!isVerified || isUpdating || username.trim().length < 3}
            className="w-full"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};