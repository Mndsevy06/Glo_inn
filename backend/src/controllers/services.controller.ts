import { Request, Response } from 'express';
import prisma from '../config/db';
import path from 'path';
import fs from 'fs';

// Get active services (public menu & order form)
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      where: { actif: true },
      orderBy: { categorie: 'asc' },
    });
    res.status(200).json(services);
  } catch (error) {
    console.error('Erreur getServices:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Get ALL services including inactive (admin management page)
export const getAllServicesAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { categorie: 'asc' },
    });
    res.status(200).json(services);
  } catch (error) {
    console.error('Erreur getAllServicesAdmin:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Create a service (with optional image upload)
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { libelle, description, tarif_unitaire, categorie, express_disponible, tarif_express, actif, image_url } = req.body;

    if (!libelle || !tarif_unitaire || !categorie) {
      res.status(400).json({ message: 'Champs obligatoires manquants (libelle, tarif_unitaire, categorie).' });
      return;
    }

    // Build image URL if file was uploaded or url provided
    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = `/uploads/services/${req.file.filename}`;
    } else if (image_url) {
      imageUrl = image_url;
    }

    const service = await prisma.service.create({
      data: {
        libelle,
        description: description || '',
        tarif_unitaire: Number(tarif_unitaire),
        categorie,
        image: imageUrl,
        express_disponible: express_disponible === 'true' || express_disponible === true,
        tarif_express: tarif_express && tarif_express !== '' ? Number(tarif_express) : null,
        actif: actif !== undefined ? (actif === 'true' || actif === true) : true,
      }
    });

    res.status(201).json({ message: 'Service créé avec succès.', service });
  } catch (error) {
    console.error('Erreur createService:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Update a service (with optional image replacement)
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { libelle, description, tarif_unitaire, categorie, express_disponible, tarif_express, actif, image_url } = req.body;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Service introuvable.' });
      return;
    }

    // Handle new image
    let imageUrl: string | undefined = undefined;
    if (req.file) {
      // Delete old image file if it exists and is local
      if (existing.image && !existing.image.startsWith('http')) {
        const oldPath = path.join(process.cwd(), existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/services/${req.file.filename}`;
    } else if (image_url !== undefined) {
      imageUrl = image_url;
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(libelle && { libelle }),
        ...(description !== undefined && { description }),
        ...(tarif_unitaire !== undefined && { tarif_unitaire: Number(tarif_unitaire) }),
        ...(categorie && { categorie }),
        ...(express_disponible !== undefined && { express_disponible: express_disponible === 'true' || express_disponible === true }),
        ...(tarif_express !== undefined && { tarif_express: tarif_express && tarif_express !== '' ? Number(tarif_express) : null }),
        ...(actif !== undefined && { actif: actif === 'true' || actif === true }),
        ...(imageUrl !== undefined && { image: imageUrl }),
      }
    });

    res.status(200).json({ message: 'Service mis à jour avec succès.', service });
  } catch (error) {
    console.error('Erreur updateService:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Delete a service
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Service introuvable.' });
      return;
    }

    // Check if this service is referenced by any order lines
    const usageCount = await prisma.ligneCommande.count({ where: { id_service: id } });
    if (usageCount > 0) {
      res.status(409).json({
        message: `Ce service est utilisé dans ${usageCount} commande(s) et ne peut pas être supprimé. Désactivez-le à la place.`,
        canDeactivate: true,
        usageCount,
      });
      return;
    }

    // Delete associated image file (only local files)
    if (existing.image && !existing.image.startsWith('http')) {
      const imgPath = path.join(process.cwd(), existing.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await prisma.service.delete({ where: { id } });

    res.status(200).json({ message: 'Service supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur deleteService:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
