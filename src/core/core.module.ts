import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllHttpExceptionsFilter } from './exceptions/filters/all-exception.filter';
import { DomainHttpExceptionsFilter } from './exceptions/filters/domain-exceptions.filter';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ObjectIdValidationTransformationPipe } from './pipes/objID-validator-transormation-pipe-service';
import { ObjectIdValidationPipe } from './pipes/objID-validator-transormation-pipe-service';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  providers: [
    // Глобальные фильтры исключений
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    // Глобальный guard для throttling
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Pipes для валидации ObjectId
    ObjectIdValidationTransformationPipe,
    ObjectIdValidationPipe,
  ],
  exports: [
    // Экспортируем pipes для использования в других модулях
    ObjectIdValidationTransformationPipe,
    ObjectIdValidationPipe,
  ],
})
export class CoreModule {}
