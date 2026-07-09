import { BaseRepository } from './BaseRepository';
import Scheme, { IScheme } from '../models/Scheme';

export class SchemeRepository extends BaseRepository<IScheme> {
  constructor() {
    super(Scheme);
  }
}

export const schemeRepository = new SchemeRepository();
