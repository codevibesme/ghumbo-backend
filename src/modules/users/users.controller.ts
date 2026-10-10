import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UpdateUserDto } from './users.dto.js';
import { ETokenFor, TVerifiedUserPayload } from '../../types/jwt.type.js';

import { JwtUtilityService } from '../../utilities/jwt/jwt.service.js';
import { UserService } from './users.service.js';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(
    private readonly jwt: JwtUtilityService,
    private readonly userService: UserService,
  ) {}

  @Patch('/me')
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'userId', type: String, description: 'ID of the user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Details updated successfully.' })
  @ApiUnauthorizedResponse({
    description: 'You are not authorised to update this data',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto,
  ) {
    const payload = await this.jwt.verify<TVerifiedUserPayload>(
      req?.headers?.authorization || '',
      ETokenFor.USER,
    );

    await this.userService.update(payload.userId, body, null);

    return res.status(200).send('Details updated successfully.');
  }
}
