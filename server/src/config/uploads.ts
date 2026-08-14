import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

/**
 * Vercel rechaza las peticiones que superan 4,5 MB con un 413
 * FUNCTION_PAYLOAD_TOO_LARGE, antes de que el codigo llegue a ejecutarse. El
 * limite previo de multer era de 10 MB, asi que la app aceptaba archivos que la
 * plataforma iba a rechazar y el usuario recibia un error de infraestructura sin
 * explicacion. Se queda por debajo de ese corte para poder dar un mensaje propio.
 *
 * No restringe nada real: una transcripcion de dos horas pesa unos 200 KB.
 */
export const MAX_TRANSCRIPCION_BYTES = 4 * 1024 * 1024;

const EXTENSIONES_ACEPTADAS = /\.(txt|md|markdown|csv|json|rtf|vtt|srt)$/i;

/**
 * La transcripcion se lee con toString('utf8'). Si alguien sube el audio del
 * PLAUD en vez del texto, hoy se producia basura en silencio y la evaluacion
 * seguia adelante como si nada. Mejor rechazarlo con un motivo claro.
 */
export const subidaTranscripcion = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TRANSCRIPCION_BYTES },
  fileFilter: (_req, file, cb) => {
    const esTexto = file.mimetype?.startsWith('text/')
      || file.mimetype === 'application/json'
      || EXTENSIONES_ACEPTADAS.test(file.originalname || '');
    if (esTexto) return cb(null, true);
    cb(new Error('TIPO_NO_SOPORTADO'));
  }
});

/**
 * Envuelve el middleware de multer para traducir sus errores a respuestas que el
 * usuario pueda entender. Sin esto, Express devuelve un 500 con HTML.
 *
 * Se envuelve en vez de encadenar un middleware de error de 4 parametros, porque
 * esa firma rompe la inferencia de tipos de las rutas de Express.
 */
export function subirTranscripcion(campo: string) {
  const middleware = subidaTranscripcion.single(campo);

  return function (req: Request, res: Response, next: NextFunction) {
    middleware(req, res, (err: any) => {
      if (!err) return next();

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'El archivo supera el límite de 4 MB.',
          detalle: 'Subí la transcripción en texto (.txt o .md), no el audio. Una entrevista de dos horas pesa unos 200 KB.'
        });
      }

      if (err.message === 'TIPO_NO_SOPORTADO') {
        return res.status(415).json({
          error: 'El archivo no es una transcripción de texto.',
          detalle: 'Se aceptan .txt, .md, .csv, .json, .vtt o .srt. Si tenés el audio del PLAUD, exportá primero la transcripción.'
        });
      }

      return next(err);
    });
  };
}
