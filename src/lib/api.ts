import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { asNumber } from "@/lib/format";
import type {
  ArticleRecord,
  ClientRecord,
  ClientStatus,
  ClientType,
  DashboardStats,
  DeliveryRecord,
  HardwareType,
  RedemptionRecord,
  RedemptionStatus,
  TicketRecord,
  TicketType,
} from "@/lib/types";

function iso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function isoOrNull(value: unknown): string | null {
  if (!value) return null;
  return iso(value);
}

function mapClient(row: Record<string, unknown>): ClientRecord {
  return {
    id: asNumber(row.id),
    name: String(row.name ?? ""),
    dniCuit: String(row.dni_cuit ?? ""),
    clientType: (row.client_type === "particular" ? "particular" : "escuela") as ClientType,
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    email: String(row.email ?? ""),
    ekopuntos: asNumber(row.ekopuntos),
    status: (row.status === "inactivo" ? "inactivo" : "activo") as ClientStatus,
    deactivatedAt: isoOrNull(row.deactivated_at),
    createdAt: iso(row.created_at),
  };
}

function mapHardware(row: Record<string, unknown>): HardwareType {
  return {
    id: asNumber(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    ekpPerKg: asNumber(row.ekp_per_kg),
    copperKgPerKg: asNumber(row.copper_kg_per_kg),
    siliconKgPerKg: asNumber(row.silicon_kg_per_kg),
    goldGPerKg: asNumber(row.gold_g_per_kg),
  };
}

function mapArticle(row: Record<string, unknown>): ArticleRecord {
  return {
    id: asNumber(row.id),
    description: String(row.description ?? ""),
    category: String(row.category ?? ""),
    costEkp: asNumber(row.cost_ekp),
    stock: asNumber(row.stock),
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
  };
}

function mapDelivery(row: Record<string, unknown>): DeliveryRecord {
  return {
    id: asNumber(row.id),
    clientId: asNumber(row.client_id),
    clientName: String(row.client_name ?? ""),
    hardwareTypeId: asNumber(row.hardware_type_id),
    hardwareName: String(row.hardware_name ?? ""),
    weightKg: asNumber(row.weight_kg),
    ekpGenerated: asNumber(row.ekp_generated),
    notes: String(row.notes ?? ""),
    createdAt: iso(row.created_at),
  };
}

function mapRedemption(row: Record<string, unknown>): RedemptionRecord {
  const status = String(row.status ?? "pendiente");
  const safeStatus: RedemptionStatus =
    status === "entregado" || status === "cancelado" ? status : "pendiente";
  return {
    id: asNumber(row.id),
    clientId: asNumber(row.client_id),
    clientName: String(row.client_name ?? ""),
    articleId: asNumber(row.article_id),
    articleDescription: String(row.article_description ?? ""),
    quantity: asNumber(row.quantity),
    ekpTotal: asNumber(row.ekp_total),
    status: safeStatus,
    cancelReason: row.cancel_reason ? String(row.cancel_reason) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapTicket(row: Record<string, unknown>): TicketRecord {
  return {
    id: asNumber(row.id),
    operationType: (row.operation_type === "canje" ? "canje" : "entrega") as TicketType,
    operationId: asNumber(row.operation_id),
    summary: String(row.summary ?? ""),
    clientName: String(row.client_name ?? ""),
    ekpAmount: asNumber(row.ekp_amount),
    createdAt: iso(row.created_at),
  };
}

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const [totals] = await sql<Record<string, unknown>>`
    select
      coalesce(sum(d.weight_kg), 0) as total_kg,
      coalesce(sum(d.ekp_generated), 0) as total_ekp,
      coalesce(sum(d.weight_kg * h.copper_kg_per_kg), 0) as copper_kg,
      coalesce(sum(d.weight_kg * h.silicon_kg_per_kg), 0) as silicon_kg,
      coalesce(sum(d.weight_kg * h.gold_g_per_kg), 0) as gold_g
    from deliveries d
    join hardware_types h on h.id = d.hardware_type_id
  `;
  const [pending] = await sql<Record<string, unknown>>`
    select count(*)::int as n from redemptions where status = 'pendiente'
  `;
  const [clients] = await sql<Record<string, unknown>>`
    select count(*)::int as n from clients where status = 'activo'
  `;
  const [stem] = await sql<Record<string, unknown>>`
    select coalesce(sum(quantity), 0)::int as n
    from redemptions
    where status = 'entregado'
  `;
  const recentDeliveries = await sql<Record<string, unknown>>`
    select d.*, c.name as client_name, h.name as hardware_name
    from deliveries d
    join clients c on c.id = d.client_id
    join hardware_types h on h.id = d.hardware_type_id
    order by d.created_at desc
    limit 4
  `;
  const recentTickets = await sql<Record<string, unknown>>`
    select * from tickets order by created_at desc limit 4
  `;
  const stats: DashboardStats = {
    totalKg: asNumber(totals?.total_kg),
    totalEkpIssued: asNumber(totals?.total_ekp),
    pendingRedemptions: asNumber(pending?.n),
    activeClients: asNumber(clients?.n),
    copperKg: asNumber(totals?.copper_kg),
    siliconKg: asNumber(totals?.silicon_kg),
    goldG: asNumber(totals?.gold_g),
    stemUnitsDelivered: asNumber(stem?.n),
    recentDeliveries: recentDeliveries.map(mapDelivery),
    recentTickets: recentTickets.map(mapTicket),
  };
  return stats;
});

export const listClients = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from clients order by status asc, name asc
  `;
  return rows.map(mapClient);
});

export const listHardwareTypes = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from hardware_types order by ekp_per_kg desc, name asc
  `;
  return rows.map(mapHardware);
});

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from articles order by active desc, category asc, description asc
  `;
  return rows.map(mapArticle);
});

export const listRedemptions = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select r.*, c.name as client_name, a.description as article_description
    from redemptions r
    join clients c on c.id = r.client_id
    join articles a on a.id = r.article_id
    order by r.created_at desc
  `;
  return rows.map(mapRedemption);
});

export const listTickets = createServerFn({ method: "GET" }).handler(async () => {
  await requireOperator();
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from tickets order by created_at desc
  `;
  return rows.map(mapTicket);
});

export const createClient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(3, "Ingresá el nombre o razón social").max(50),
      dniCuit: z.string().trim().min(7, "Ingresá DNI o CUIT").max(15),
      clientType: z.enum(["escuela", "particular"]),
      phone: z.string().trim().max(20).default(""),
      address: z.string().trim().max(80).default(""),
      email: z.string().trim().max(80).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    const existing = await sql<{ id: number }>`
      select id from clients where dni_cuit = ${data.dniCuit} limit 1
    `;
    if (existing.length) {
      throw new Error("Ya existe un cliente con ese DNI / CUIT.");
    }
    const rows = await sql<Record<string, unknown>>`
      insert into clients (name, dni_cuit, client_type, phone, address, email)
      values (${data.name}, ${data.dniCuit}, ${data.clientType}, ${data.phone}, ${data.address}, ${data.email})
      returning *
    `;
    return mapClient(rows[0]!);
  });

export const setClientStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      status: z.enum(["activo", "inactivo"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    const deactivatedAt = data.status === "inactivo" ? new Date().toISOString() : null;
    const rows = await sql<Record<string, unknown>>`
      update clients
      set status = ${data.status},
          deactivated_at = ${deactivatedAt}
      where id = ${data.id}
      returning *
    `;
    if (!rows[0]) throw new Error("Cliente no encontrado.");
    return mapClient(rows[0]);
  });

export const createArticle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      description: z.string().trim().min(3).max(60),
      category: z.string().trim().min(3).max(50),
      costEkp: z.number().int().min(1).max(100000),
      stock: z.number().int().min(0).max(999999),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      insert into articles (description, category, cost_ekp, stock)
      values (${data.description}, ${data.category}, ${data.costEkp}, ${data.stock})
      returning *
    `;
    return mapArticle(rows[0]!);
  });

export const updateArticleCost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      costEkp: z.number().int().min(1).max(100000),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      update articles set cost_ekp = ${data.costEkp} where id = ${data.id} returning *
    `;
    if (!rows[0]) throw new Error("Artículo no encontrado.");
    return mapArticle(rows[0]);
  });

export const setArticleActive = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      update articles set active = ${data.active} where id = ${data.id} returning *
    `;
    if (!rows[0]) throw new Error("Artículo no encontrado.");
    return mapArticle(rows[0]);
  });

export const registerDelivery = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clientId: z.number().int(),
      hardwareTypeId: z.number().int(),
      weightKg: z.number().positive().max(5000),
      notes: z.string().trim().max(200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      const clients = await tx<Record<string, unknown>>`
        select * from clients where id = ${data.clientId} for update
      `;
      const client = clients[0];
      if (!client) throw new Error("Seleccioná un cliente o escuela activa.");
      if (client.status !== "activo") {
        throw new Error("El cliente está dado de baja. Reactivalo para acreditar puntos.");
      }
      const types = await tx<Record<string, unknown>>`
        select * from hardware_types where id = ${data.hardwareTypeId} limit 1
      `;
      const hardware = types[0];
      if (!hardware) throw new Error("Seleccioná una categoría de hardware.");
      const ekp = Math.round(data.weightKg * asNumber(hardware.ekp_per_kg));
      if (ekp <= 0) throw new Error("El pesaje no genera EkoPuntos. Revisá los kilos ingresados.");

      const inserted = await tx<Record<string, unknown>>`
        insert into deliveries (client_id, hardware_type_id, weight_kg, ekp_generated, notes)
        values (${data.clientId}, ${data.hardwareTypeId}, ${data.weightKg}, ${ekp}, ${data.notes})
        returning *
      `;
      await tx`
        update clients set ekopuntos = ekopuntos + ${ekp} where id = ${data.clientId}
      `;
      const summary = `Recepción ${data.weightKg.toLocaleString("es-AR")} kg ${String(hardware.name)}`;
      const tickets = await tx<Record<string, unknown>>`
        insert into tickets (operation_type, operation_id, summary, client_name, ekp_amount)
        values ('entrega', ${asNumber(inserted[0]?.id)}, ${summary}, ${String(client.name)}, ${ekp})
        returning *
      `;
      return {
        delivery: mapDelivery({
          ...inserted[0],
          client_name: client.name,
          hardware_name: hardware.name,
        }),
        ticket: mapTicket(tickets[0]!),
        ekp,
      };
    });
  });

export const registerRedemption = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clientId: z.number().int(),
      articleId: z.number().int(),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      const clients = await tx<Record<string, unknown>>`
        select * from clients where id = ${data.clientId} for update
      `;
      const client = clients[0];
      if (!client) throw new Error("Seleccioná un cliente o escuela.");
      if (client.status !== "activo") throw new Error("El cliente está dado de baja.");

      const articles = await tx<Record<string, unknown>>`
        select * from articles where id = ${data.articleId} for update
      `;
      const article = articles[0];
      if (!article || !article.active) throw new Error("El artículo no está disponible.");
      const stock = asNumber(article.stock);
      if (stock < data.quantity) {
        throw new Error(`Stock insuficiente. Quedan ${stock} unidades.`);
      }
      const total = asNumber(article.cost_ekp) * data.quantity;
      const balance = asNumber(client.ekopuntos);
      if (balance < total) {
        throw new Error(
          `Saldo insuficiente. Tiene ${balance.toLocaleString("es-AR")} EKP y el canje requiere ${total.toLocaleString("es-AR")} EKP.`,
        );
      }

      const inserted = await tx<Record<string, unknown>>`
        insert into redemptions (client_id, article_id, quantity, ekp_total, status)
        values (${data.clientId}, ${data.articleId}, ${data.quantity}, ${total}, 'pendiente')
        returning *
      `;
      await tx`
        update clients set ekopuntos = ekopuntos - ${total} where id = ${data.clientId}
      `;
      await tx`
        update articles set stock = stock - ${data.quantity} where id = ${data.articleId}
      `;
      const summary = `Canje de ${data.quantity}× ${String(article.description)}`;
      const tickets = await tx<Record<string, unknown>>`
        insert into tickets (operation_type, operation_id, summary, client_name, ekp_amount)
        values ('canje', ${asNumber(inserted[0]?.id)}, ${summary}, ${String(client.name)}, ${total})
        returning *
      `;
      return {
        redemption: mapRedemption({
          ...inserted[0],
          client_name: client.name,
          article_description: article.description,
        }),
        ticket: mapTicket(tickets[0]!),
      };
    });
  });

export const updateRedemptionStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      status: z.enum(["entregado", "cancelado"]),
      cancelReason: z.string().trim().max(100).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      const rows = await tx<Record<string, unknown>>`
        select * from redemptions where id = ${data.id} for update
      `;
      const current = rows[0];
      if (!current) throw new Error("Canje no encontrado.");
      if (current.status !== "pendiente") {
        throw new Error("Solo se pueden actualizar canjes pendientes.");
      }

      const clients = await tx<Record<string, unknown>>`
        select name from clients where id = ${asNumber(current.client_id)} limit 1
      `;
      const articles = await tx<Record<string, unknown>>`
        select description from articles where id = ${asNumber(current.article_id)} limit 1
      `;
      const client = clients[0];
      const article = articles[0];
      if (!client || !article) throw new Error("No se encontraron los datos asociados al canje.");

      let updated: Record<string, unknown>[];
      if (data.status === "cancelado") {
        const reason = data.cancelReason?.trim();
        if (!reason) throw new Error("Indicá el motivo de cancelación.");
        await tx`
          update clients
          set ekopuntos = ekopuntos + ${asNumber(current.ekp_total)}
          where id = ${asNumber(current.client_id)}
        `;
        await tx`
          update articles
          set stock = stock + ${asNumber(current.quantity)}
          where id = ${asNumber(current.article_id)}
        `;
        updated = await tx<Record<string, unknown>>`
          update redemptions
          set status = 'cancelado',
              cancel_reason = ${reason},
              updated_at = now()
          where id = ${data.id}
          returning *
        `;
      } else {
        updated = await tx<Record<string, unknown>>`
          update redemptions
          set status = 'entregado',
              updated_at = now()
          where id = ${data.id}
          returning *
        `;
      }
      return mapRedemption({
        ...updated[0],
        client_name: client.name,
        article_description: article.description,
      });
    });
  });
