import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule], // ✅ Donne accès à UsersService via exports
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}