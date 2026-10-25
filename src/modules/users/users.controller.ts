import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UpdateUserDto } from './users.dto.js';

import { UserService } from './users.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { type AuthenticatedUserReq } from '../../interfaces/index.js';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Details updated successfully.' })
  @ApiUnauthorizedResponse({
    description: 'You are not authorised to update this data',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async update(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Body() body: UpdateUserDto,
  ) {
    await this.userService.update(req.user.userId, body, null);

    return res.status(200).send('Details updated successfully.');
  }
}
