import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ChatbotLog } from './chatbot-log.entity';

export enum WhatsAppFlowState {
  MenuPrincipal = 'Menu_Principal',
  ConsultarStock = 'Consultar_Stock',
  Horarios = 'Horarios',
  ConsultarAsistencia = 'Consultar_Asistencia',
  EsperandoOpcion = 'Esperando_Opcion',
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
    default: WhatsAppFlowState.MenuPrincipal,
  })
  flow_state: WhatsAppFlowState;

  @Column({ type: 'timestamp' })
  last_interaction: Date;

  @OneToMany(() => ChatbotLog, (log) => log.session)
  logs: ChatbotLog[];
}
