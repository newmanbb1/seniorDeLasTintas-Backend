import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ChatbotLog } from './chatbot-log.entity';

export enum WhatsAppFlowState {
  SeleccionandoCategoria = 'Seleccionando_Categoria',
  ConsultarStock = 'Consultar_Stock',
  ConsultarAsistencia = 'Consultar_Asistencia',
}

@Entity('whatsapp_session')
export class WhatsAppSession {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_name: string;

  @Column({
    type: 'enum',
    enum: WhatsAppFlowState,
    default: WhatsAppFlowState.SeleccionandoCategoria,
  })
  flow_state: WhatsAppFlowState;

  @Column({ type: 'timestamp' })
  last_interaction: Date;

  @Column({ type: 'text', nullable: true })
  last_message: string;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @Column({ type: 'int', default: 0 })
  unread_count: number;

  @Column({ type: 'boolean', default: false })
  is_archived: boolean;

  @OneToMany(() => ChatbotLog, (log) => log.session)
  logs: ChatbotLog[];
}
