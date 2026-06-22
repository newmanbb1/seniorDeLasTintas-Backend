import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AiIntentResult {
  intencion: string;
  confianza: number;
  parametros: Record<string, string>;
  respuesta?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly model = 'deepseek-chat';

  constructor(private readonly configService: ConfigService) {}

  async classifyIntent(userMessage: string): Promise<AiIntentResult> {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY no configurada, usando fallback');
      return { intencion: 'UNKNOWN', confianza: 0, parametros: {} };
    }

    try {
      const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'Eres el asistente virtual de "Señor de las Tintas", una tintorería. Atiendes a los clientes por WhatsApp.\n\n' +
                'Tu personalidad: eres amable, cálido, servicial y conversas de forma natural como un vendedor de barrio. Usas un tono cercano y amigable, tratando al cliente con confianza pero respeto. Puedes usar emojis ocasionalmente. Hablas en español natural, NO robotizado.\n\n' +
                'Clasifica el mensaje del cliente en UNA de estas intenciones:\n\n' +
                '- SALUDO: cuando el cliente saluda (hola, buenos días, buenas, qué tal, cómo estás). Salúdale con entusiasmo y pregúntale en qué puedes ayudarle.\n' +
                '- CATEGORIA_TINTAS: el cliente pregunta por tintas, cartuchos de tinta, recarga de tintas, O cuando solo menciona una marca de tintas (HP, Canon, Epson, etc.). Responde con información sobre los tipos, marcas y disponibilidad general.\n' +
                '- CATEGORIA_TONER: el cliente pregunta por tóner, cartuchos de tóner, O cuando solo menciona una marca de tóner. Responde con información de marcas y disponibilidad general.\n' +
                '- CATEGORIA_SERVICIO_TECNICO: el cliente pregunta por servicio técnico, reparación, mantenimiento de impresoras. Explica los servicios ofrecidos.\n' +
                '- CATEGORIA_REPUESTO: el cliente pregunta por repuestos, piezas, cabezales, rodillos. Menciona los tipos de repuestos disponibles.\n' +
                '- CONSULTAR_STOCK: SOLO cuando el cliente pregunta específicamente si hay STOCK/DISPONIBILIDAD de un producto concreto y modelo exacto (ej: "tienes tinta negra canon", "hay cartucho hp 123"). PREFIERE usar CATEGORIA a menos que el cliente pregunte explícitamente por stock.\n' +
                '- CONSULTAR_HORARIO: el cliente pregunta horarios, ubicación, dirección, sucursales. \
Proporciona la información de horarios y ubicaciones de forma natural.\n' +
                '- MENU: el cliente escribe "0", "menú", "volver", "atrás". \
Preséntale el menú principal con las opciones disponibles.\n' +
                '- UNKNOWN: si no puedes clasificar el mensaje. Pídele amablemente que sea más específico.\n\n' +
                'Responde ÚNICAMENTE con un JSON válido en este formato:\n' +
                '{\n' +
                '  "intencion": "CATEGORIA_TINTAS",\n' +
                '  "confianza": 0.95,\n' +
                '  "parametros": {"marca": "canon", "producto": "tinta negra"},\n' +
                '  "respuesta": "¡Claro que sí! 😊 Trabajamos con tintas originales y compatibles para todas las marcas. Tenemos de Canon, Epson, HP, Brother... ¿Qué marca te interesa?"\n' +
                '}\n\n' +
                'La respuesta debe ser natural, conversacional y variada (no repitas siempre el mismo texto). Si es SALUDO, saluda de forma diferente cada vez. Los parámetros son opcionales, solo inclúyelos si el mensaje menciona marcas o productos específicos.',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 250,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        intencion: parsed.intencion || 'UNKNOWN',
        confianza: parsed.confianza || 0,
        parametros: parsed.parametros || {},
        respuesta: parsed.respuesta || undefined,
      };
    } catch (error) {
      this.logger.error('Error llamando a DeepSeek API:', error instanceof Error ? error.message : error);
      return { intencion: 'UNKNOWN', confianza: 0, parametros: {} };
    }
  }
}
