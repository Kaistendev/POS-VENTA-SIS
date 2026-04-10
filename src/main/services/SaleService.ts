import { SaleRepository } from "../repositories/SaleRepository.js";
//import { ProductRepository } from '../repositories/ProductRepository.js';
import { Sale, SaleItem } from "../../common/types.js";

export class SaleService {
  static async getAllSales() {
    return SaleRepository.findAll();
  }

  static async getSaleDetails(id: number) {
    return SaleRepository.findById(id);
  }

  static async registerSale(
    saleData: Omit<Sale, "id" | "created_at" | "updated_at"> & {
      client_name?: string;
      client_dni?: string;
    },
    itemsData: Omit<SaleItem, "id" | "sale_id" | "created_at" | "updated_at">[],
  ) {
    try {
      if (itemsData.length === 0) throw new Error("Venta vacía.");

      let finalClientId = saleData.client_id;

      // Lógica de Cliente Dinámico: Si se provee nombre y DNI, buscamos o creamos
      if (saleData.client_dni && saleData.client_name) {
        const { ClientRepository } =
          await import("../repositories/ClientRepository.js");
        const existingClient = await ClientRepository.findByDni(
          saleData.client_dni,
        );

        if (existingClient) {
          finalClientId = existingClient.id!;
        } else {
          // Crear cliente al vuelo
          const [idRow] = await ClientRepository.create({
            dni: saleData.client_dni,
            name: saleData.client_name,
            code: `CLI-${Date.now()}`, // Generar código simple
          });
          finalClientId = typeof idRow === "object" ? (idRow as any).id : idRow;
        }
      }

      const total = itemsData.reduce(
        (acc, item) => acc + item.unit_price * item.quantity,
        0,
      );

      // Limpiar datos extras que no van en la tabla sales
      const { client_name, client_dni, ...saleFields } = saleData;

      const newSaleId = await SaleRepository.createSaleWithItems(
        {
          ...saleFields,
          client_id: finalClientId,
          total,
        },
        itemsData,
      );

      return { success: true, id: newSaleId };
    } catch (error: any) {
      console.error("Error al registrar venta:", error);
      return {
        success: false,
        message: error.message || "Error al registrar venta",
      };
    }
  }
}
