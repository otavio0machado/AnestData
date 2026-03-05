import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useFormContext } from 'react-hook-form';
import { BoletimForm } from '../../types';

export default function SignatureField() {
  const sigRef = useRef<SignatureCanvas>(null);
  const { setValue, watch } = useFormContext<BoletimForm>();
  const current = watch('assinatura');

  function handleEnd() {
    const dataUrl = sigRef.current?.toDataURL('image/png');
    if (dataUrl) setValue('assinatura', dataUrl);
  }

  function handleClear() {
    sigRef.current?.clear();
    setValue('assinatura', undefined);
  }

  return (
    <div>
      <label className="label">Assinatura Digital</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleEnd}
          penColor="#1a56a0"
          canvasProps={{ className: 'w-full', height: 120 }}
        />
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={handleClear} className="btn-secondary text-sm py-1.5 px-3">
          Limpar
        </button>
        {current && <span className="text-xs text-green-600 font-medium">✓ Assinatura capturada</span>}
        {!current && <span className="text-xs text-gray-400">Assine acima com o dedo ou mouse</span>}
      </div>
    </div>
  );
}
