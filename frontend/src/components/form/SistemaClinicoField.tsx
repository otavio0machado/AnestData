import { useFormContext } from 'react-hook-form';
import { BoletimForm } from '../../types';
import clsx from 'clsx';

type Sistema = 'cardiovascular' | 'respiratorio' | 'neurologico' | 'endocrinoReprodutor' | 'oncologico' | 'digestivo' | 'renalUrinario' | 'ortopedico';

interface Props {
  name: Sistema;
  label: string;
  extra?: React.ReactNode;
}

export default function SistemaClinicoField({ name, label, extra }: Props) {
  const { register, watch, setValue } = useFormContext<BoletimForm>();
  const sp = watch(`${name}.semParticularidades`);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-semibold text-primary-800">{label}</span>
        <button
          type="button"
          onClick={() => setValue(`${name}.semParticularidades`, !sp)}
          className={clsx(
            'text-xs px-2.5 py-1 rounded-full font-medium border transition-colors',
            sp ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          )}
        >
          SP
        </button>
      </div>
      {!sp && (
        <div className="p-3 space-y-2">
          <textarea
            {...register(`${name}.anotacoes`)}
            rows={2}
            placeholder="Anotações..."
            className="input-field-sm resize-none"
          />
          {extra}
        </div>
      )}
    </div>
  );
}
