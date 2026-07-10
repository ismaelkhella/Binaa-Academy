import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, HttpCode } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/cart.dto';
import { StudentJwtGuard } from '../auth/guards/jwt.guard';

@Controller('cart')
@UseGuards(StudentJwtGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Req() req: { user: { sub: string } }) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post('add')
  addToCart(@Req() req: { user: { sub: string } }, @Body() dto: AddCartItemDto) {
    return this.cartService.addToCart(req.user.sub, dto.subjectId);
  }

  @Delete('remove/:subjectId')
  removeFromCart(@Req() req: { user: { sub: string } }, @Param('subjectId') subjectId: string) {
    return this.cartService.removeFromCart(req.user.sub, subjectId);
  }

  @Post('checkout')
  @HttpCode(200)
  checkout(@Req() req: { user: { sub: string } }) {
    return this.cartService.checkout(req.user.sub);
  }
}
