import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    locale: string;
    theme: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: { email: string; password: string; displayName?: string }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException({ code: 'invalid_email', message: 'Invalid email.' });
    }
    if (!input.password || input.password.length < 8) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'Password must be at least 8 characters.',
      });
    }
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: 'email_in_use', message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = this.users.create({
      email,
      displayName: input.displayName ?? null,
      passwordHash,
      locale: 'en',
      theme: 'system',
    });
    await this.users.save(user);
    return this.sign(user);
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }
    return this.sign(user);
  }

  async me(userId: string): Promise<AuthResult['user'] | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      theme: user.theme,
    };
  }

  private async sign(user: UserEntity): Promise<AuthResult> {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        locale: user.locale,
        theme: user.theme,
      },
    };
  }
}
