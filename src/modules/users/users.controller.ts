import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserDetailsDto } from './users.dto.js';

import { UserService } from './users.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { type AuthenticatedUserReq } from '../../interfaces/index.js';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: UserDetailsDto })
  @ApiNotFoundResponse({ description: 'Not found ' })
  @ApiUnauthorizedResponse({ description: 'Unauthorised' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getDetails(@Req() req: AuthenticatedUserReq, @Res() res: Response) {
    const data = await this.userService.getDetails(req.user.userId);

    return res.status(200).send(data);
  }
}
