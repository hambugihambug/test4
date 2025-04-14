import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { PatientWithDetails } from "@shared/schema";

interface PatientDetailsProps {
  patientId?: number;
}

export function PatientDetails({ patientId }: PatientDetailsProps) {
  const { t } = useI18n();
  const [patient, setPatient] = useState<PatientWithDetails | null>(null);
  
  const { data: patientData, isLoading } = useQuery<PatientWithDetails>({
    queryKey: ['/api/patients', patientId, 'details'],
    enabled: !!patientId,
  });
  
  // Fetch first patient if no patientId provided
  const { data: patients } = useQuery<PatientWithDetails[]>({
    queryKey: ['/api/patients'],
    enabled: !patientId,
  });
  
  useEffect(() => {
    if (patientId && patientData) {
      setPatient(patientData);
    } else if (!patientId && patients && patients.length > 0) {
      setPatient(patients[0]);
    }
  }, [patientId, patientData, patients]);
  
  const handleContactGuardian = () => {
    // Handle contact guardian logic
    console.log("Contacting guardian for patient:", patient?.id);
  };
  
  const getFallRiskClass = (risk?: string) => {
    switch(risk) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
          <h3 className="font-medium text-neutral-800">{t('dashboard.patientDetails')}</h3>
        </div>
        <CardContent className="p-4 flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!patient) {
    return (
      <Card>
        <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
          <h3 className="font-medium text-neutral-800">{t('dashboard.patientDetails')}</h3>
        </div>
        <CardContent className="p-4 text-center text-neutral-500">
          No patient selected
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
        <h3 className="font-medium text-neutral-800">{t('dashboard.patientDetails')}</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            {t('dashboard.viewDetails')}
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-neutral-800">{patient.name}</h4>
            <p className="text-sm text-neutral-500">{patient.room?.name} / {t('beds')} {patient.bedNumber}</p>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 pt-3 space-y-2">
          <div className="grid grid-cols-2 text-sm">
            <div className="text-neutral-500">{t('dashboard.age')}</div>
            <div className="text-neutral-800 font-medium">{patient.age}세</div>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="text-neutral-500">{t('dashboard.heightWeight')}</div>
            <div className="text-neutral-800 font-medium">
              {patient.height ? `${patient.height}cm` : '-'} / {patient.weight ? `${patient.weight}kg` : '-'}
            </div>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="text-neutral-500">{t('dashboard.bloodType')}</div>
            <div className="text-neutral-800 font-medium">{patient.blood || '-'}</div>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="text-neutral-500">{t('dashboard.assignedNurse')}</div>
            <div className="text-neutral-800 font-medium">{patient.assignedNurse?.name || '-'}</div>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="text-neutral-500">{t('dashboard.fallRisk')}</div>
            <div className={`font-medium ${getFallRiskClass(patient.fallRisk)}`}>
              {patient.fallRisk === 'high' ? t('dashboard.highRisk') : 
               patient.fallRisk === 'medium' ? t('dashboard.mediumRisk') : 
               t('dashboard.lowRisk')}
            </div>
          </div>
        </div>
        
        {patient.guardian && (
          <div className="border-t border-neutral-200 mt-3 pt-3 space-y-2">
            <h5 className="font-medium text-sm text-neutral-800">{t('dashboard.guardianInfo')}</h5>
            <div className="grid grid-cols-2 text-sm">
              <div className="text-neutral-500">{t('common.name')}</div>
              <div className="text-neutral-800 font-medium">{patient.guardian.name}</div>
            </div>
            <div className="grid grid-cols-2 text-sm">
              <div className="text-neutral-500">{t('dashboard.contact')}</div>
              <div className="text-neutral-800 font-medium">{patient.guardian.tel}</div>
            </div>
            <Button className="w-full mt-2 flex items-center justify-center" onClick={handleContactGuardian}>
              <MessageSquare className="h-4 w-4 mr-1.5" />
              {t('dashboard.contactGuardian')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
