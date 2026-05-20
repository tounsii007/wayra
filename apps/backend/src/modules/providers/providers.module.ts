import { Global, Module } from '@nestjs/common';
import { DbProvider } from './db.provider';
import { SncfProvider } from './sncf.provider';
import { IdfmProvider } from './idfm.provider';
import { SncftProvider } from './sncft.provider';
import { ProviderRegistry } from './provider-registry.service';

@Global()
@Module({
  providers: [DbProvider, SncfProvider, IdfmProvider, SncftProvider, ProviderRegistry],
  exports: [DbProvider, SncfProvider, IdfmProvider, SncftProvider, ProviderRegistry],
})
export class ProvidersModule {}
