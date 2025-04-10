import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Certificate, CertificateStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function getDaysUntilExpiration(date: Date | string): number {
  const expirationDate = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return differenceInDays(expirationDate, today);
}

export function getCertificateStatus(certificate: Certificate): CertificateStatus {
  const daysUntilExpiration = getDaysUntilExpiration(certificate.expirationDate);
  
  if (daysUntilExpiration < 0) {
    return "expired";
  } else if (daysUntilExpiration <= 3) {
    return "critical";
  } else if (daysUntilExpiration <= 30) {
    return "expiring";
  } else {
    return "valid";
  }
}

export function getStatusBadgeColor(status: CertificateStatus): string {
  switch (status) {
    case "valid":
      return "bg-green-100 text-green-800";
    case "expiring":
      return "bg-orange-100 text-orange-800";
    case "critical":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

export function getStatusText(status: CertificateStatus): string {
  switch (status) {
    case "valid":
      return "Válido";
    case "expiring":
      return "A vencer";
    case "critical":
      return "Crítico";
    case "expired":
      return "Expirado";
    default:
      return "Desconhecido";
  }
}

export function getRandomOTPCode(): string {
  // In a real app, this would be a request to a backend that would send
  // an actual SMS/email with a code
  return Math.floor(100000 + Math.random() * 900000).toString();
}
