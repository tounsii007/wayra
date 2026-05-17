import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoritePlaceEntity, SavedRouteEntity } from '../../database/entities';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(FavoritePlaceEntity)
    private readonly favorites: Repository<FavoritePlaceEntity>,
    @InjectRepository(SavedRouteEntity)
    private readonly saved: Repository<SavedRouteEntity>,
  ) {}

  async listFavorites(userId: string) {
    return this.favorites.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addFavorite(
    userId: string,
    body: { kind: 'home' | 'work' | 'custom'; placeId: string; label?: string },
  ) {
    const existing = await this.favorites.findOne({
      where: { userId, kind: body.kind, placeId: body.placeId },
    });
    if (existing) return existing;
    const created = this.favorites.create({
      userId,
      kind: body.kind,
      placeId: body.placeId,
      label: body.label ?? null,
    });
    return this.favorites.save(created);
  }

  async removeFavorite(userId: string, id: string) {
    const row = await this.favorites.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException({ code: 'favorite_not_found', message: 'Not found' });
    await this.favorites.delete(row.id);
    return { ok: true };
  }

  async listSavedRoutes(userId: string) {
    return this.saved.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async saveRoute(
    userId: string,
    body: { label?: string; data: Record<string, unknown>; notify?: boolean },
  ) {
    const row = this.saved.create({
      userId,
      label: body.label ?? null,
      data: body.data,
      notifyOnDisruption: !!body.notify,
    });
    return this.saved.save(row);
  }

  async removeSavedRoute(userId: string, id: string) {
    const row = await this.saved.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException({ code: 'route_not_found', message: 'Not found' });
    await this.saved.delete(row.id);
    return { ok: true };
  }
}
