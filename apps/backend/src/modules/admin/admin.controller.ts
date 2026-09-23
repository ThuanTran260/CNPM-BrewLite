import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService, CurrentAdmin } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('users')
  async getAllUsers() {
    return this.adminService.findAllUsers();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentAdmin: CurrentAdmin,
  ) {
    return this.adminService.updateUserRole(id, dto.role, currentAdmin);
  }
}
