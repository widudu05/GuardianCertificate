import { 
  User as DbUser, 
  Company as DbCompany,
  Certificate as DbCertificate,
  UserPermission as DbUserPermission,
  ActivityLog as DbActivityLog,
  CertificateSystem as DbCertificateSystem
} from "@shared/schema";

// Omit password from user type in client
export type User = Omit<DbUser, 'password'>;

export type Company = DbCompany;

export type Certificate = DbCertificate;

export type UserPermission = DbUserPermission;

export type ActivityLog = DbActivityLog & {
  user?: User;
};

export type CertificateSystem = DbCertificateSystem;

export type DashboardStats = {
  totalCertificates: number;
  expiringCertificates: number;
  a1Certificates: number;
  a3Certificates: number;
};

export type VerifyPasswordRequest = {
  certificateId: number;
  authCode: string;
};

export type CertificatePasswordResponse = {
  password: string;
};

export type CertificateStatus = 'valid' | 'expiring' | 'expired' | 'critical';
