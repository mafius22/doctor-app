import { useState } from 'react';
import { patientService } from '../services/patient.service';
import { Modal } from './SlotModal';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  doctorId: string;
  doctorName: string;
  onSuccess: () => void;
}

export const ReviewModal = ({ doctorId, doctorName, onSuccess }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const promise = patientService.addReview({ doctorId, rating, comment });

    try {
      await toast.promise(promise, {
        loading: 'Wysyłanie opinii...',
        success: 'Dziękujemy! Twoja opinia została dodana.',
        error: (err) => {
          const serverMsg = err.response?.data?.message || '';

          if (serverMsg.toLowerCase().includes('already') || serverMsg.toLowerCase().includes('exists')) {
             return 'Już oceniłeś tego lekarza';
          }

          return 'Wystąpił błąd. Nie udało się dodać opinii.';
        }
      });

      setIsOpen(false);
      setRating(5);
      setComment('');
      onSuccess();
      
    } catch (error: any) {
      
      const status = error.response?.status;
      const message = error.response?.data?.message || '';

      if (status === 409 || message.toLowerCase().includes('już')) {
         setIsOpen(false);
         onSuccess(); 
      }
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1 transition-colors hover:text-blue-800"
      >
        <Star size={14} /> Oceń wizytę
      </button>

      <Modal isOpen={isOpen} onClose={() => !isSubmitting && setIsOpen(false)} title={`Oceń wizytę: ${doctorName}`}>
        <div className="space-y-4">
          
          <div className="flex justify-center gap-2 text-yellow-400 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)} 
                type="button"
                className="transition hover:scale-110 focus:outline-none"
              >
                 <Star 
                    size={32} 
                    fill={star <= rating ? "currentColor" : "none"} 
                    strokeWidth={1.5}
                 />
              </button>
            ))}
          </div>

          <textarea 
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
            placeholder="Napisz kilka słów o przebiegu wizyty..." 
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={isSubmitting}
          />

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className={`w-full py-2 rounded-lg font-medium text-white transition
              ${isSubmitting 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`
            }
          >
            {isSubmitting ? 'Wysyłanie...' : 'Wyślij Opinię'}
          </button>
        </div>
      </Modal>
    </>
  );
};