import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import {
  CONTACT_DETAIL_KINDS,
  CONTACT_PLACEMENTS,
  CONTENT_STATUSES,
  type ContactDetailKind,
  type ContactPlacement,
  type ContentStatus,
} from '@/constants';
import { baseToJSON } from './shared';

/**
 * A published phone number, email address or WhatsApp line.
 *
 * Stored as rows rather than as a settings blob so the super admin can add and
 * remove lines without an edit clobbering a concurrent one, and so each line
 * carries its own placement and order.
 *
 * `kind` selects the link scheme (tel:, mailto:, wa.me) from a closed list
 * rather than storing the href, so a record can never introduce a javascript:
 * or data: URL into the header of every page.
 */
export interface ContactDetailAttributes {
  _id: Types.ObjectId;
  kind: ContactDetailKind;
  /** The number or address as it should read on screen. */
  value: string;
  /** Small caption above the value, e.g. "Sales" or "Alternate line". */
  label?: string;
  placement: ContactPlacement;
  /**
   * The line used where only one can be shown — the top bar, the WhatsApp
   * widget and the schema.org block. The lowest sortOrder wins when unset.
   */
  isPrimary: boolean;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactDetailSchema = new Schema<ContactDetailAttributes>(
  {
    kind: { type: String, enum: CONTACT_DETAIL_KINDS, required: true },
    value: { type: String, required: true, trim: true, maxlength: 160 },
    label: { type: String, trim: true, maxlength: 60 },
    placement: { type: String, enum: CONTACT_PLACEMENTS, default: 'both' },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// The header/footer query: published details in display order.
contactDetailSchema.index({ status: 1, kind: 1, sortOrder: 1 });

export type ContactDetailDocument = HydratedDocument<ContactDetailAttributes>;

export const ContactDetail: Model<ContactDetailAttributes> =
  (models.ContactDetail as Model<ContactDetailAttributes>) ??
  model<ContactDetailAttributes>('ContactDetail', contactDetailSchema);
