import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findIngenieurs(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: 'ingenieur' },
      select: ['id', 'name', 'email', 'role', 'must_change_password'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} non trouvé`);
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'ingenieur',
      must_change_password: false,
    });
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // ✅ Si admin change le mot de passe → forcer le changement à la prochaine connexion
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      await this.userRepository.update(id, {
        password: updateUserDto.password,
        must_change_password: true, // ✅ flag activé
      });
      return this.findOne(id);
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  // ✅ Ingénieur change son propre mot de passe
  async changePassword(id: number, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, {
      password: hashedPassword,
      must_change_password: false, // ✅ flag désactivé
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}