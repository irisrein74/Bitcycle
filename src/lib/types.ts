export type ClientStatus = "activo" | "inactivo";
export type ClientType = "escuela" | "particular";
export type RedemptionStatus = "pendiente" | "entregado" | "cancelado";
export type TicketType = "entrega" | "canje";
export type OperatorRole = "operador" | "admin";

export type OperatorSession = {
  username: string;
  displayName: string;
  role: OperatorRole;
};

export type ClientRecord = {
  id: number;
  name: string;
  dniCuit: string;
  clientType: ClientType;
  phone: string;
  address: string;
  email: string;
  ekopuntos: number;
  status: ClientStatus;
  deactivatedAt: string | null;
  createdAt: string;
};

export type HardwareType = {
  id: number;
  name: string;
  description: string;
  ekpPerKg: number;
  copperKgPerKg: number;
  siliconKgPerKg: number;
  goldGPerKg: number;
};

export type ArticleRecord = {
  id: number;
  description: string;
  category: string;
  costEkp: number;
  stock: number;
  active: boolean;
  createdAt: string;
};

export type DeliveryRecord = {
  id: number;
  clientId: number;
  clientName: string;
  hardwareTypeId: number;
  hardwareName: string;
  weightKg: number;
  ekpGenerated: number;
  notes: string;
  createdAt: string;
};

export type RedemptionRecord = {
  id: number;
  clientId: number;
  clientName: string;
  articleId: number;
  articleDescription: string;
  quantity: number;
  ekpTotal: number;
  status: RedemptionStatus;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketRecord = {
  id: number;
  operationType: TicketType;
  operationId: number;
  summary: string;
  clientName: string;
  ekpAmount: number;
  createdAt: string;
};

export type DashboardStats = {
  totalKg: number;
  totalEkpIssued: number;
  pendingRedemptions: number;
  activeClients: number;
  copperKg: number;
  siliconKg: number;
  goldG: number;
  stemUnitsDelivered: number;
  recentDeliveries: DeliveryRecord[];
  recentTickets: TicketRecord[];
};
