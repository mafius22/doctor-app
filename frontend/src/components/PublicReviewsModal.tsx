import { useEffect, useState } from 'react';
import { patientService } from '../services/patient.service'; 
import { X, Star, MessageSquare, User, Calendar } from 'lucide-react';

interface Review {
  _id: string;
  authorName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  doctorReply?: string; 
}

interface Props {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

export const PublicReviewsModal = ({ doctorId, doctorName, onClose }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getDoctorReviews(doctorId)
      .then(setReviews)
      .catch(err => console.error("Błąd pobierania opinii", err))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const average = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        
        <div className="p-5 border-b flex justify-between items-start bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Opinie pacjentów</h2>
            <p className="text-sm text-gray-500 mt-1">Lekarz: <span className="font-semibold text-blue-600">{doctorName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl mb-6">
             <div className="flex items-center gap-2 text-yellow-500 bg-white px-3 py-2 rounded-lg shadow-sm">
                <Star fill="currentColor" size={24} />
                <span className="text-2xl font-bold text-gray-900">{average}</span>
             </div>
             <p className="text-gray-600 font-medium">
               Na podstawie {reviews.length} {reviews.length === 1 ? 'opinii' : 'opinii'}
             </p>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Ładowanie opinii...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center text-gray-400">
               <MessageSquare size={48} className="mb-2 opacity-20"/>
               <p>Ten lekarz nie ma jeszcze żadnych opinii.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <div className="bg-gray-100 p-1.5 rounded-full text-gray-500">
                         <User size={14} />
                       </div>
                       <span className="font-bold text-gray-700 text-sm">{review.authorName}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12}/> {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-gray-600 text-sm leading-relaxed">"{review.comment}"</p>
                  )}

                  {review.doctorReply && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-blue-200 bg-blue-50/50 p-3 rounded-r-lg">
                      <p className="text-xs font-bold text-blue-600 mb-1">Odpowiedź lekarza:</p>
                      <p className="text-xs text-gray-600 italic">{review.doctorReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-center">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Zamknij</button>
        </div>
      </div>
    </div>
  );
};