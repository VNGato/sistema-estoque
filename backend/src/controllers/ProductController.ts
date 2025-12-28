import { Request, Response } from 'express';
import prisma from '../prismaClient';

export class ProductController {

    // 1. Criar novo Produto
    async create(req: Request, res: Response) {
        try {
            const { name, sku, costPrice, salePrice, stock, minStock } = req.body;

            // Verifica se SKU já existe
            const productExists = await prisma.product.findUnique({ where: { sku } });
            if (productExists) {
                return res.status(400).json({ error: "Produto com este SKU já existe!" });
            }

            const product = await prisma.product.create({
                data: {
                    name,
                    sku,
                    costPrice,
                    salePrice,
                    stock,
                    minStock
                }
            });

            return res.status(201).json(product);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao criar produto", details: error });
        }
    }

    // 2. Listar todos os Produtos
    async list(req: Request, res: Response) {
        try {
            const products = await prisma.product.findMany({
                orderBy: { id: 'desc' } // Mostra os mais novos primeiro
            });
            return res.json(products);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao buscar produtos" });
        }
    }
    // 3. Vender (Diminuir 1 do estoque)
  async sell(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body; // Quantidade para vender (padrão 1)

      // Atualiza o banco diminuindo o estoque
      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          stock: { decrement: amount || 1 } 
        }
      });
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao realizar venda" });
    }
  }

  // REPOR (Aumentar Estoque)
  async restock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      
      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          stock: { increment: amount || 1 } // <--- ISSO QUE SOMA
        }
      });

      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao repor estoque" });
    }
  }

  // 4. Deletar Produto
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.product.delete({
        where: { id: Number(id) }
      });
      return res.status(200).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar produto" });
    }
  }
  // 5. ATUALIZAR (Edição completa: Estoque, Nome, Preço...)
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, sku, salePrice, stock, minStock } = req.body;

      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name,
          sku,
          salePrice,
          stock, // Aqui a mágica acontece: ele grava o número exato que você mandar
          minStock
        }
      });
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  }
  // 6. DESLIGAR SISTEMA (Mata os processos do Node)
  async shutdown(req: Request, res: Response) {
    // Comando do Windows para matar o Node
    const { exec } = require('child_process');
    res.send("Desligando...");
    
    // Espera 1 segundo e mata tudo
    setTimeout(() => {
      exec('taskkill /f /im node.exe', (err: any) => {
        if (err) console.error(err);
      });
    }, 500);
  }
}