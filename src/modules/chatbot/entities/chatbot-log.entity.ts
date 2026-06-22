import { BaseEntity } from 'src/common/entities/BaseEntity';
import { WhatsAppSession } from './whatsapp-session.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum ChatbotIntention {
  Saludo = 'Saludo',
  CategoriaTintas = 'Categoria_Tintas',
  CategoriaToner = 'Categoria_Toner',
  CategoriaServicioTecnico = 'Categoria_Servicio_Tecnico',
  CategoriaRepuesto = 'Categoria_Repuesto',
  ConsultarStock = 'Consultar_Stock',
  ConsultarHorario = 'Consultar_Horario',
  ConsultarAsistencia = 'Consultar_Asistencia',
  MenuPrincipal = 'Menu_Principal',
  Unknown = 'Unknown',
}

@Entity('chatbot_log')
export class ChatbotLog extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  @Index()
  phone_number: string;

  @ManyToOne(() => WhatsAppSession, (session) => session.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'phone_number', referencedColumnName: 'phone_number' })
  session: WhatsAppSession;

  @Column({
    type: 'enum',
    enum: ChatbotIntention,
    default: ChatbotIntention.Unknown,
  })
  @Index()
  detected_intention: ChatbotIntention;

  @Column({ type: 'text', nullable: true })
  user_message: string;

  @Column({ type: 'text', nullable: true })
  bot_response: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;
}
