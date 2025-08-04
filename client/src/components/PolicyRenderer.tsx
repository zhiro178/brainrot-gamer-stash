import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PolicySection {
  id: string;
  icon: string;
  title: string;
  content: {
    text: string;
    items?: string[];
    note?: string;
    warning?: { type: string; text: string };
    info?: { type: string; text: string };
    tip?: { type: string; text: string };
    security?: { type: string; text: string };
  };
}

interface PolicyData {
  sections: PolicySection[];
  footer?: { text: string };
  effective_date?: { title: string; content: string[] };
}

interface PolicyRendererProps {
  policyData: PolicyData;
}

const getAlertClasses = (type: string) => {
  switch (type) {
    case 'amber':
      return 'bg-amber-50 border border-amber-200 text-amber-800';
    case 'blue':
      return 'bg-blue-50 border border-blue-200 text-blue-800';
    case 'green':
      return 'bg-green-50 border border-green-200 text-green-800';
    case 'red':
      return 'bg-red-50 border border-red-200 text-red-800';
    case 'purple':
      return 'bg-purple-50 border border-purple-200 text-purple-800';
    default:
      return 'bg-gray-50 border border-gray-200 text-gray-800';
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'amber':
      return '⚠️';
    case 'blue':
      return 'ℹ️';
    case 'green':
      return '💡';
    case 'red':
      return '⚠️';
    case 'purple':
      return '🔐';
    default:
      return 'ℹ️';
  }
};

export const PolicyRenderer: React.FC<PolicyRendererProps> = ({ policyData }) => {
  if (!policyData || !policyData.sections) {
    return <div>No policy data available</div>;
  }

  return (
    <div className="space-y-6">
      {policyData.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              {section.icon} {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{section.content.text}</p>
            
            {section.content.items && section.content.items.length > 0 && (
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {section.content.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            {section.content.note && (
              <p className="text-sm text-muted-foreground">
                {section.content.note}
              </p>
            )}

            {section.content.warning && (
              <div className={`rounded-lg p-4 ${getAlertClasses(section.content.warning.type)}`}>
                <p className="text-sm flex items-start gap-2">
                  <span className={`${section.content.warning.type === 'amber' ? 'text-amber-600' : 'text-red-600'} mt-0.5`}>
                    {getAlertIcon(section.content.warning.type)}
                  </span>
                  <span><strong>Important:</strong> {section.content.warning.text}</span>
                </p>
              </div>
            )}

            {section.content.info && (
              <div className={`rounded-lg p-4 ${getAlertClasses(section.content.info.type)}`}>
                <p className="text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">
                    {getAlertIcon(section.content.info.type)}
                  </span>
                  <span>{section.content.info.text}</span>
                </p>
              </div>
            )}

            {section.content.tip && (
              <div className={`rounded-lg p-4 ${getAlertClasses(section.content.tip.type)}`}>
                <p className="text-sm flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">
                    {getAlertIcon(section.content.tip.type)}
                  </span>
                  <span><strong>Security Tip:</strong> {section.content.tip.text}</span>
                </p>
              </div>
            )}

            {section.content.security && (
              <div className={`rounded-lg p-4 ${getAlertClasses(section.content.security.type)}`}>
                <p className="text-sm flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">
                    {getAlertIcon(section.content.security.type)}
                  </span>
                  <span>{section.content.security.text}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {policyData.effective_date && (
        <div className="mt-12 text-center space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{policyData.effective_date.title}</h3>
            {policyData.effective_date.content.map((text, index) => (
              <p key={index} className="text-sm text-muted-foreground mt-2">
                {text}
              </p>
            ))}
          </div>
        </div>
      )}

      {policyData.footer && (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {policyData.footer.text}
          </p>
        </div>
      )}
    </div>
  );
};