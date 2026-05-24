import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    const isMatch = user
      ? await bcrypt.compare(loginDto.password, user.password)
      : false;

    if (!user || !isMatch) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    // ✅ Retour explicite avec email inclus
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}