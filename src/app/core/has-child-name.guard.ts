import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameStateService } from './game-state.service';

/** Chặn vào màn chọn chế độ / chơi khi chưa có tên bé, đưa về màn nhập tên. */
export const hasChildNameGuard: CanActivateFn = () => {
  const gameState = inject(GameStateService);
  const router = inject(Router);
  if (gameState.childName()) return true;
  return router.parseUrl('/');
};
