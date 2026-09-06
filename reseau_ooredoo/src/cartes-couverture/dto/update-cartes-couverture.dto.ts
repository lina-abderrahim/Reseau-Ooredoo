export class UpdateCartesCouvertureDto {
  statut?: string;
  nom?: string;
  description?: string;
  commentaire_refus?: string;
  type_commentaire?: string;
  user_id?: number;
  service_technologie_id?: number;
  polygones?: {
    coordinates: string;
    qualite: string;
  }[];
  // ✅ Ajoutés pour la modification avec import SHP
  session_id?: string;
  qualite?: string;
}