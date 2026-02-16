import { useEffect, useState } from 'react';
import { doctorService, type Review } from '../services/doctor.service';
import { MessageSquare, Star, Reply } from 'lucide-react';

export const DoctorReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({}); 

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getMyReviews();
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text) return;

    try {
      await doctorService.replyToReview(reviewId, text);
      alert('Odpowiedź wysłana!');
      fetchReviews(); 
    } catch (e) {
      alert('Błąd wysyłania odpowiedzi');
    }
  };

  if (loading) return <div className="p-8 text-center">Ładowanie opinii...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3 mb-8 border-b pb-4">
        <MessageSquare className="text-blue-600" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Opinie Pacjentów</h1>
          <p className="text-gray-500">Przeglądaj oceny i odpowiadaj na komentarze.</p>
        </div>
      </header>

      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Brak opinii. Poczekaj na pierwsze wizyty!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-full flex items-center justify-center">
                    {review.authorName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.authorName}</p>
                    <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" />
                  ))}
                </div>
              </div>

              <div className="pl-12">
                <p className="text-gray-700 italic mb-4">"{review.comment || 'Brak komentarza słownego'}"</p>

                {review.doctorReply ? (
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="text-xs font-bold text-blue-600 mb-1">Twoja odpowiedź ({new Date(review.doctorReplyAt!).toLocaleDateString()}):</p>
                    <p className="text-sm text-gray-600">{review.doctorReply}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <textarea
                      placeholder="Napisz odpowiedź do pacjenta..."
                      className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={2}
                      value={replyText[review.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={!replyText[review.id]}
                      className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      <Reply size={16} />
                      Odpowiedz
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};