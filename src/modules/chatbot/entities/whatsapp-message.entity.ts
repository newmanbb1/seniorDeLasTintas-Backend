import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Column, Entity, Index } from 'typeorm';

export enum WhatsAppMessageType {
  Text = 'text',
  Image = 'image',
  Document = 'document',
  Audio = 'audio',
  Video = 'video',
  Button = 'button',
  List = 'list',
  Unknown = 'unknown',
}

@Entity('whatsapp_message')
export class WhatsAppMessage extends BaseEntity {
  @Column('uuid', { nullable: true })
  declare created_by: string;
  @Column({ type: 'varchar', length: 20 })
  @Index()
  phone_number: string;

  @Column({ type: 'boolean' })
  from_me: boolean;

  @Column({
    type: 'enum',
    enum: WhatsAppMessageType,
    default: WhatsAppMessageType.Text,
  })
  message_type: WhatsAppMessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  media_url: string;

  @Column({ type: 'varchar', nullable: true })
  @Index({ unique: true })
  wa_message_id: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;
}
