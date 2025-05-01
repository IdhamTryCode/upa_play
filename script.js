// Logika untuk game Jigsaw Puzzle
document.addEventListener('DOMContentLoaded', () => {
    // Deteksi perangkat dan browser untuk pengaturan performa
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 600;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    // Setel preferensi performa
    const useCssTransform = isMobile; // Gunakan transform untuk perangkat mobile
    const lowerQualityOnMobile = isMobile; // Kurangi kualitas visual pada perangkat mobile
    
    // Mencegah momentum scroll dan perilaku lain yang mengganggu
    if (isMobile) {
        // Hanya mencegah scroll pada elemen puzzle, bukan seluruh halaman
        puzzleBoard.addEventListener('touchmove', function(e) {
            if (draggedPiece) {
                e.preventDefault();
            }
        }, { passive: false });
        
        referenceContainer.addEventListener('touchmove', function(e) {
            if (draggedPiece) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Mencegah highlight pada tap tanpa mencegah klik
        document.addEventListener('touchstart', function(e) {
            const target = e.target;
            if (target.closest('.puzzle-piece') || target.classList.contains('puzzle-piece')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Nonaktifkan double-tap zoom pada iOS hanya pada elemen puzzle
        if (isIOS) {
            puzzleBoard.addEventListener('touchend', function(e) {
                const target = e.target;
                if (target.closest('.puzzle-piece') || target.classList.contains('puzzle-piece')) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            referenceContainer.addEventListener('touchend', function(e) {
                const target = e.target;
                if (target.closest('.puzzle-piece') || target.classList.contains('puzzle-piece')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    // Elemen-elemen DOM
    const gameScreen = document.getElementById('game-screen');
    const puzzleBoard = document.getElementById('puzzle-board');
    const difficultySelect = document.getElementById('difficulty');
    const shuffleButton = document.getElementById('shuffle-button');
    const successModal = document.getElementById('success-modal');
    const playAgainButton = document.getElementById('play-again');
    const referenceImage = document.getElementById('reference-image');
    const referencePanel = document.querySelector('.reference-panel');
    const referenceContainer = document.querySelector('.reference-image-container');
    
    // Setup musik background
    const bgMusic = [
        'sounds/music1.mp3'
    ];
    
    let currentMusicIndex = Math.floor(Math.random() * bgMusic.length);
    const musicPlayer = new Audio();
    musicPlayer.volume = 0.5; // Set volume 50%
    let musicMuted = false;
    
    // Fungsi untuk memuat dan memainkan musik berikutnya
    function playNextMusic() {
        musicPlayer.src = bgMusic[currentMusicIndex];
        
        // Mulai mainkan musik jika tidak muted
        if (!musicMuted) {
            musicPlayer.play().catch(err => {
                console.log('Autoplay musik gagal: ', err);
                
                // Menambahkan listener klik untuk play musik setelah interaksi user
                document.addEventListener('click', function musicStarter() {
                    if (!musicMuted) {
                        musicPlayer.play().catch(e => console.log('Masih gagal memainkan musik: ', e));
                    }
                    document.removeEventListener('click', musicStarter);
                }, { once: true });
            });
        }
        
        // Pilih musik berikutnya secara acak ketika musik yang diputar selesai
        musicPlayer.onended = function() {
            // Acak indeks musik berikutnya
            const nextIndex = Math.floor(Math.random() * bgMusic.length);
            // Pastikan tidak memainkan lagu yang sama dua kali berturut-turut
            currentMusicIndex = (nextIndex !== currentMusicIndex) ? nextIndex : (nextIndex + 1) % bgMusic.length;
            playNextMusic();
        };
    }
    
    // Toggle mute/unmute musik
    function toggleMusic() {
        const musicToggleBtn = document.getElementById('music-toggle');
        
        if (musicMuted) {
            // Unmute musik
            musicMuted = false;
            musicPlayer.volume = 0.5;
            musicPlayer.play().catch(err => console.log('Gagal memainkan musik: ', err));
            musicToggleBtn.textContent = '🔊';
            musicToggleBtn.classList.remove('muted');
        } else {
            // Mute musik
            musicMuted = true;
            musicPlayer.pause();
            musicToggleBtn.textContent = '🔇';
            musicToggleBtn.classList.add('muted');
        }
    }
    
    // Event listener untuk tombol toggle musik
    document.getElementById('music-toggle').addEventListener('click', toggleMusic);
    
    // Mainkan musik pertama saat halaman dimuat
    playNextMusic();
    
    // Konstanta baru untuk ukuran puzzle dan toleransi magnet
    const PUZZLE_BOARD_SIZE = isMobile ? 300 : 400;
    const MAGNET_THRESHOLD = 40; // Jarak dalam piksel untuk efek magnet
    const TOLERANCE = 20; // Toleransi untuk penempatan yang benar
    
    // Sesuaikan ukuran board berdasarkan perangkat
    if (isMobile) {
        puzzleBoard.style.width = `${PUZZLE_BOARD_SIZE}px`;
        puzzleBoard.style.height = `${PUZZLE_BOARD_SIZE}px`;
        referenceContainer.style.width = `${PUZZLE_BOARD_SIZE}px`;
        referenceContainer.style.height = `${PUZZLE_BOARD_SIZE}px`;
    }
    
    // Variabel untuk menyimpan state permainan
    let gridSize = parseInt(difficultySelect.value);
    let pieces = [];
    let draggedPiece = null;
    let correctPieces = 0;
    let currentPuzzleImage = '';
    
    // Sound effects (opsional)
    const correctSound = new Audio();
    correctSound.src = 'sounds/correct.mp3';
    
    const successSound = new Audio();
    successSound.src = 'sounds/success.mp3';
    
    // Data gambar puzzle
    const puzzleImages = [
        { id: 1, src: 'images/puzzle1.jpg', name: 'Puzzle 1' },
        { id: 2, src: 'images/puzzle2.jpg', name: 'Puzzle 2' },
        { id: 3, src: 'images/puzzle3.jpg', name: 'Puzzle 3' },
        { id: 4, src: 'images/puzzle4.jpg', name: 'Puzzle 4' },
        { id: 5, src: 'images/puzzle5.jpg', name: 'Puzzle 5' },
        { id: 6, src: 'images/puzzle6.jpg', name: 'Puzzle 6' },
        { id: 7, src: 'images/puzzle7.jpg', name: 'Puzzle 7' },
        { id: 8, src: 'images/puzzle8.jpg', name: 'Puzzle 8' },
        { id: 9, src: 'images/puzzle9.jpg', name: 'Puzzle 9' },
        { id: 10, src: 'images/puzzle10.png', name: 'Puzzle 10' },
        { id: 11, src: 'images/puzzle11.jpg', name: 'Puzzle 11' },
        { id: 12, src: 'images/puzzle12.jpg', name: 'Puzzle 12' },
        { id: 13, src: 'images/puzzle13.png', name: 'Puzzle 13' },
        { id: 14, src: 'images/puzzle14.jpg', name: 'Puzzle 14' },
        { id: 15, src: 'images/puzzle15.jpg', name: 'Puzzle 15' },
        { id: 16, src: 'images/puzzle16.jpg', name: 'Puzzle 16' },
        { id: 17, src: 'images/puzzle17.jpg', name: 'Puzzle 17' },
        { id: 18, src: 'images/puzzle18.jpg', name: 'Puzzle 18' },
        { id: 19, src: 'images/puzzle19.jpg', name: 'Puzzle 19' },
        { id: 20, src: 'images/puzzle20.jpg', name: 'Puzzle 20' },
        { id: 21, src: 'images/puzzle21.jpg', name: 'Puzzle 21' },
        { id: 22, src: 'images/puzzle22.jpg', name: 'Puzzle 22' },
        { id: 23, src: 'images/puzzle23.jpg', name: 'Puzzle 23' },
        { id: 24, src: 'images/puzzle24.png', name: 'Puzzle 24' }
    ];
    
    // Simpan koordinat terakhir untuk mendeteksi pergerakan yang minimal
    let lastX = 0, lastY = 0;
    const MOVE_THRESHOLD = 1; // Minimal pergerakan untuk memperbarui posisi (dalam piksel)
    
    // Fungsi untuk memulai permainan
    function startGame(puzzle) {
        // Simpan gambar yang dipilih
        currentPuzzleImage = puzzle.src;
        
        // Atur gambar referensi
        document.getElementById('reference-image').src = currentPuzzleImage;
        
        // Reset status permainan
        correctPieces = 0;
        
        // Bersihkan kotak reference
        while (referenceContainer.children.length > 1) {
            const child = referenceContainer.lastChild;
            if (child !== referenceImage) {
                referenceContainer.removeChild(child);
            }
        }
        
        // Buat potongan puzzle
        createPuzzlePieces();
        
        // Pastikan semua potongan terlihat dengan mengakses offsetWidth
        // Ini akan memaksa browser untuk merender puzzle sebelum animasi lainnya
        pieces.forEach(piece => {
            void piece.element.offsetWidth;
        });
    }
    
    // Fungsi untuk membuat potongan puzzle
    function createPuzzlePieces() {
        // Reset board
        puzzleBoard.innerHTML = '';
        pieces = [];
        correctPieces = 0;
        
        // Ukuran setiap potongan puzzle
        const pieceWidth = PUZZLE_BOARD_SIZE / gridSize;
        const pieceHeight = PUZZLE_BOARD_SIZE / gridSize;
        
        // Buat potongan puzzle
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.style.width = `${pieceWidth}px`;
                piece.style.height = `${pieceHeight}px`;
                
                // Set background gambar dengan posisi yang tepat
                piece.style.backgroundImage = `url('${currentPuzzleImage}')`;
                piece.style.backgroundSize = `${PUZZLE_BOARD_SIZE}px ${PUZZLE_BOARD_SIZE}px`;
                piece.style.backgroundPosition = `-${x * pieceWidth}px -${y * pieceHeight}px`;
                
                // Simpan posisi asli (untuk mengecek apakah sudah benar)
                piece.dataset.x = x;
                piece.dataset.y = y;
                
                // Tambahkan ke array pieces
                pieces.push({
                    element: piece,
                    correctX: x * pieceWidth,
                    correctY: y * pieceHeight,
                    originalBoardX: 0, // Posisi awal di kotak kiri (diperbarui saat shuffle)
                    originalBoardY: 0, // Posisi awal di kotak kiri (diperbarui saat shuffle)
                    currentX: 0,
                    currentY: 0,
                    isPlaced: false // Flag untuk melacak apakah potongan sudah ditempatkan di kotak kanan
                });
                
                // Tambahkan ke board
                puzzleBoard.appendChild(piece);
            }
        }
        
        // Acak potongan puzzle
        shufflePieces();
        
        // Tambahkan event listener untuk drag and drop
        setupDragAndDrop();
    }
    
    // Fungsi untuk mengacak potongan puzzle
    function shufflePieces() {
        successModal.classList.add('hidden');
        
        // Nonaktifkan semua transisi untuk meningkatkan performa shuffle
        pieces.forEach(piece => {
            piece.element.style.transition = 'none';
            // Hapus semua kelas animasi
            piece.element.classList.remove('correct', 'correct-counted', 'returning', 'dragging', 'magnet-active');
            piece.isPlaced = false;
            
            // Reset z-index
            piece.element.style.zIndex = '1';
            
            // Pindahkan semua potongan kembali ke puzzleBoard (kotak kiri)
            if (piece.element.parentNode !== puzzleBoard) {
                puzzleBoard.appendChild(piece.element);
            }
        });
        
        // Trigger reflow untuk memastikan perubahan segera diterapkan
        void puzzleBoard.offsetWidth;
        
        // Buat array posisi untuk kotak kiri
        const positions = [];
        const pieceWidth = PUZZLE_BOARD_SIZE / gridSize;
        const pieceHeight = PUZZLE_BOARD_SIZE / gridSize;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                positions.push({
                    x: x * pieceWidth,
                    y: y * pieceHeight
                });
            }
        }
        
        // Acak array posisi dengan algoritma Fisher-Yates yang lebih efisien
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        // Letakkan potongan puzzle sesuai posisi acak tanpa animasi
        pieces.forEach((piece, index) => {
            piece.currentX = positions[index].x;
            piece.currentY = positions[index].y;
            piece.originalBoardX = positions[index].x;
            piece.originalBoardY = positions[index].y;
            
            piece.element.style.left = `${piece.currentX}px`;
            piece.element.style.top = `${piece.currentY}px`;
            
            // Variasi z-index sederhana untuk mencegah tumpang tindih
            piece.element.style.zIndex = `${1 + (index % 4)}`;
        });
        
        // Aktifkan kembali transisi setelah semua potongan ditempatkan
        setTimeout(() => {
            pieces.forEach(piece => {
                piece.element.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
            });
        }, 100);
        
        correctPieces = 0;
    }
    
    // Setup drag and drop functionality
    function setupDragAndDrop() {
        pieces.forEach(piece => {
            // Berikan z-index awal
            piece.element.style.zIndex = '1';
            
            piece.element.addEventListener('mousedown', startDrag);
            piece.element.addEventListener('touchstart', startDrag);
        });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    // Fungsi untuk memulai drag
    function startDrag(e) {
        e.preventDefault();
        
        // Identifikasi element yang di-drag
        const element = e.target.closest('.puzzle-piece');
        if (!element) return;
        
        // Tambahkan kelas dragging
        element.classList.add('dragging');
        
        // Naikkan z-index saat drag ke nilai tinggi
        element.style.zIndex = '1000';
        
        // Simpan referensi
        draggedPiece = pieces.find(piece => piece.element === element);
        
        // Simpan offset untuk posisi mouse relatif terhadap potongan puzzle
        const rect = element.getBoundingClientRect();
        if (e.type === 'mousedown') {
            draggedPiece.offsetX = e.clientX - rect.left;
            draggedPiece.offsetY = e.clientY - rect.top;
        } else {
            // Tambahkan perhitungan offset yang lebih tepat untuk touch devices
            const touch = e.touches[0];
            draggedPiece.offsetX = touch.clientX - rect.left;
            draggedPiece.offsetY = touch.clientY - rect.top;
            
            // Simpan juga touch identifier untuk tracking yang lebih baik
            draggedPiece.touchId = touch.identifier;
        }
        
        // Simpan parent container awal (puzzleBoard atau referenceContainer)
        draggedPiece.startContainer = element.parentNode;
    }
    
    // Fungsi untuk melakukan drag
    function drag(e) {
        if (!draggedPiece) return;
        e.preventDefault();
        
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        // Cek apakah gerakan cukup signifikan untuk diperbarui
        const deltaX = Math.abs(clientX - lastX);
        const deltaY = Math.abs(clientY - lastY);
        
        if (deltaX < MOVE_THRESHOLD && deltaY < MOVE_THRESHOLD) {
            return; // Gerakan terlalu kecil, skip update
        }
        
        lastX = clientX;
        lastY = clientY;
        
        // Gunakan requestAnimationFrame untuk memastikan performa yang baik
        requestAnimationFrame(() => {
            // Update posisi dengan transformasi CSS daripada left/top untuk performa yang lebih baik
            if (useCssTransform) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                
                draggedPiece.element.style.position = 'fixed';
                draggedPiece.element.style.transform = `translate3d(${clientX - draggedPiece.offsetX}px, ${clientY - draggedPiece.offsetY}px, 0)`;
                draggedPiece.element.style.left = '0';
                draggedPiece.element.style.top = '0';
            } else {
                draggedPiece.element.style.position = 'absolute';
                draggedPiece.element.style.left = `${clientX - draggedPiece.offsetX - document.body.scrollLeft}px`;
                draggedPiece.element.style.top = `${clientY - draggedPiece.offsetY - document.body.scrollTop}px`;
            }
            
            // Pastikan element masih di dalam document.body
            if (draggedPiece.element.parentNode !== document.body) {
                document.body.appendChild(draggedPiece.element);
            }
        });
    }
    
    // Fungsi untuk mengakhiri drag
    function endDrag(e) {
        if (!draggedPiece) return;
        
        // Hilangkan kelas dragging
        draggedPiece.element.classList.remove('dragging');
        
        // Cek posisi akhir mouse/touch relatif ke kedua container
        let x, y, targetContainer;
        const pieceWidth = PUZZLE_BOARD_SIZE / gridSize;
        const pieceHeight = PUZZLE_BOARD_SIZE / gridSize;
        
        if (e.type === 'mouseup' || e.type === 'touchend') {
            let clientX, clientY;
            
            if (e.type === 'mouseup') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                // Untuk touchend, ambil posisi terakhir dari changedTouches
                let touchFound = false;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    // Pastikan kita menggunakan touch yang sama dengan yang kita track
                    if (draggedPiece.touchId === touch.identifier) {
                        clientX = touch.clientX;
                        clientY = touch.clientY;
                        touchFound = true;
                        break;
                    }
                }
                
                // Jika tidak menemukan touch yang sama, gunakan touch pertama
                if (!touchFound && e.changedTouches.length > 0) {
                    const touch = e.changedTouches[0];
                    clientX = touch.clientX;
                    clientY = touch.clientY;
                }
            }
            
            // Cek apakah mouse/touch berada di area referenceContainer
            const refRect = referenceContainer.getBoundingClientRect();
            if (
                clientX >= refRect.left && 
                clientX <= refRect.right && 
                clientY >= refRect.top && 
                clientY <= refRect.bottom
            ) {
                // Mouse/touch berada di referenceContainer
                targetContainer = referenceContainer;
                
                // Hitung posisi relatif terhadap referenceContainer
                x = clientX - refRect.left - draggedPiece.offsetX;
                y = clientY - refRect.top - draggedPiece.offsetY;
                
                // Batasi posisi dalam area referenceContainer
                x = Math.max(0, Math.min(x, PUZZLE_BOARD_SIZE - pieceWidth));
                y = Math.max(0, Math.min(y, PUZZLE_BOARD_SIZE - pieceHeight));
                
                // Hitung posisi grid terdekat di mana potongan ini seharusnya ditempatkan
                const gridX = Math.round(x / pieceWidth) * pieceWidth;
                const gridY = Math.round(y / pieceHeight) * pieceHeight;
                
                // Periksa apakah posisi grid ini adalah posisi yang benar untuk potongan ini
                const isCorrect = (
                    gridX === draggedPiece.correctX && 
                    gridY === draggedPiece.correctY
                );
                
                if (isCorrect) {
                    // Potongan di posisi yang benar
                    targetContainer.appendChild(draggedPiece.element);
                    
                    // Reset positioning dan transformasi
                    draggedPiece.element.style.position = 'absolute';
                    draggedPiece.element.style.transform = 'none';
                    
                    // Langsung letakkan di posisi yang tepat tanpa animasi
                    draggedPiece.element.style.transition = 'none';
                    draggedPiece.element.style.left = `${draggedPiece.correctX}px`;
                    draggedPiece.element.style.top = `${draggedPiece.correctY}px`;
                    draggedPiece.currentX = draggedPiece.correctX;
                    draggedPiece.currentY = draggedPiece.correctY;
                    
                    // Tambahkan efek visual yang minimal
                    draggedPiece.element.classList.add('correct');
                    draggedPiece.isPlaced = true;
                    
                    // Set z-index berdasarkan posisi
                    const x = parseInt(draggedPiece.element.dataset.x);
                    const y = parseInt(draggedPiece.element.dataset.y);
                    draggedPiece.element.style.zIndex = 50 + (y * gridSize + x);
                    
                    // Putar suara benar
                    try {
                        correctSound.play();
                    } catch (error) {
                        console.log('Sound not available');
                    }
                    
                    // Check if this piece was not already counted
                    if (!draggedPiece.element.classList.contains('correct-counted')) {
                        draggedPiece.element.classList.add('correct-counted');
                        correctPieces++;
                        
                        // Cek jika semua potongan sudah benar
                        if (correctPieces === pieces.length) {
                            setTimeout(showSuccessMessage, 500);
                        }
                    }
                } else {
                    // Posisi tidak benar, kembalikan ke kotak kiri dengan animasi
                    returnPieceToOrigin();
                }
            } else {
                // Mouse/touch berada di luar referenceContainer, kembalikan ke kotak kiri
                returnPieceToOrigin();
            }
        }
        
        // Fungsi untuk mengembalikan potongan ke posisi asalnya dengan animasi yang lebih ringan
        function returnPieceToOrigin() {
            // Hapus transisi untuk kembali langsung tanpa animasi
            draggedPiece.element.style.transition = 'none';
            
            // Kembalikan ke puzzleBoard
            puzzleBoard.appendChild(draggedPiece.element);
            
            // Reset positioning ke absolute dan bersihkan transformasi
            draggedPiece.element.style.position = 'absolute';
            draggedPiece.element.style.transform = 'none';
            
            // Kembalikan langsung ke posisi awal tanpa animasi
            draggedPiece.element.style.left = `${draggedPiece.originalBoardX}px`;
            draggedPiece.element.style.top = `${draggedPiece.originalBoardY}px`;
            draggedPiece.currentX = draggedPiece.originalBoardX;
            draggedPiece.currentY = draggedPiece.originalBoardY;
            draggedPiece.element.style.zIndex = '1';
            draggedPiece.isPlaced = false;
        }
        
        // Reset draggedPiece
        draggedPiece = null;
    }
    
    // Fungsi untuk menampilkan pesan sukses
    function showSuccessMessage() {
        successModal.classList.remove('hidden');
        
        // Putar suara sukses (jika ada)
        try {
            successSound.play();
        } catch (error) {
            console.log('Sound not available');
        }
    }
    
    // Fungsi untuk preload semua gambar puzzle
    function preloadAllImages() {
        console.log("Memulai preload semua gambar...");
        
        // Untuk iPad dan iOS, force reload dulu
        if (isIOS) {
            console.log("Terdeteksi perangkat iOS, menerapkan teknik khusus loading gambar");
        }
        
        // Tambahkan parameter cache-busting untuk mencegah caching
        function getImageUrl(src) {
            const cacheBuster = `?v=${new Date().getTime()}`;
            return src + cacheBuster;
        }
        
        // Buat array promises
        const promises = puzzleImages.map((puzzle, index) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                
                // Set crossOrigin untuk mengatasi masalah CORS
                img.crossOrigin = "Anonymous";
                
                // Deteksi loading berhasil
                img.onload = () => {
                    console.log(`✅ Gambar berhasil dimuat: ${puzzle.name}`);
                    resolve(puzzle);
                };
                
                // Deteksi error loading dengan detail
                img.onerror = (err) => {
                    console.warn(`❌ Gagal memuat gambar: ${puzzle.src}`, err);
                    
                    // Coba sekali lagi dengan cache busting
                    const retryImg = new Image();
                    retryImg.crossOrigin = "Anonymous";
                    
                    retryImg.onload = () => {
                        console.log(`✅ Retry berhasil untuk gambar: ${puzzle.name}`);
                        // Perbarui URL di array
                        puzzle.src = getImageUrl(puzzle.src);
                        resolve(puzzle);
                    };
                    
                    retryImg.onerror = () => {
                        console.error(`❌❌ Retry gagal untuk gambar: ${puzzle.src}`);
                        
                        // Jika gambar tidak bisa dimuat sama sekali, gunakan fallback sederhana
                        if (index < 3) {
                            // Untuk 3 gambar pertama, coba gunakan gambar placeholder
                            const fallbackSrc = `https://via.placeholder.com/400x400?text=Puzzle+${index+1}`;
                            console.log(`Mencoba fallback dari placeholder: ${fallbackSrc}`);
                            
                            const fallbackImg = new Image();
                            fallbackImg.onload = () => {
                                console.log(`✅ Fallback berhasil untuk gambar ${index+1}`);
                                puzzle.src = fallbackSrc;
                                resolve(puzzle);
                            };
                            
                            fallbackImg.onerror = () => {
                                console.error(`❌❌❌ Semua percobaan gagal untuk gambar ${index+1}`);
                                resolve(null);
                            };
                            
                            fallbackImg.src = fallbackSrc;
                        } else {
                            resolve(null);
                        }
                    };
                    
                    // Coba lagi dengan cache busting
                    retryImg.src = getImageUrl(puzzle.src);
                };
                
                // Mulai memuat gambar
                img.src = puzzle.src;
                
                // Log untuk debugging
                console.log(`🔄 Memulai loading: ${puzzle.name} (${puzzle.src})`);
            });
        });
        
        // Tangani semua promises
        Promise.all(promises).then(results => {
            // Filter gambar yang berhasil dimuat
            const loadedImages = results.filter(img => img !== null);
            console.log(`Berhasil memuat ${loadedImages.length} dari ${puzzleImages.length} gambar`);
            
            if (loadedImages.length > 0) {
                // Mulai game dengan gambar yang berhasil dimuat pertama
                startRandomPuzzle(loadedImages);
            } else {
                // Jika semua gambar gagal, buat gambar canvas default
                console.error("Semua gambar gagal dimuat! Membuat gambar canvas default");
                createFallbackImage();
            }
        }).catch(error => {
            console.error("Error dalam Promise.all:", error);
            createFallbackImage();
        });
    }
    
    // Fungsi untuk membuat gambar fallback menggunakan Canvas jika semua gambar gagal
    function createFallbackImage() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            
            // Buat gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(1, '#2980b9');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Tambahkan teks
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Jigsaw Puzzle Game', canvas.width/2, canvas.height/2 - 20);
            ctx.font = '18px Arial';
            ctx.fillText('Gambar tidak dapat dimuat', canvas.width/2, canvas.height/2 + 20);
            
            // Konversi ke data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Buat objek gambar fallback
            const fallbackPuzzle = {
                id: 0,
                src: dataUrl,
                name: 'Fallback Puzzle'
            };
            
            // Mulai game dengan gambar fallback
            startGame(fallbackPuzzle);
            
        } catch (e) {
            console.error("Gagal membuat gambar fallback:", e);
            alert('Gagal memuat gambar puzzle. Silakan refresh halaman dan coba lagi.');
        }
    }
    
    // Mulai permainan dengan gambar acak ketika halaman dimuat
    function startRandomPuzzle(availableImages) {
        console.log("Memulai puzzle acak dengan", availableImages ? availableImages.length : 0, "gambar tersedia");
        
        // Gunakan availableImages jika disediakan, jika tidak gunakan puzzleImages
        const imagePool = availableImages || puzzleImages;
        
        if (!imagePool || imagePool.length === 0) {
            console.error("Tidak ada gambar tersedia!");
            createFallbackImage();
            return;
        }
        
        // Pilih puzzle acak dari daftar gambar
        const randomIndex = Math.floor(Math.random() * imagePool.length);
        const randomPuzzle = imagePool[randomIndex];
        
        if (!randomPuzzle || !randomPuzzle.src) {
            console.error("Objek puzzle tidak valid:", randomPuzzle);
            createFallbackImage();
            return;
        }
        
        console.log(`Memilih gambar: ${randomPuzzle.name} (${randomPuzzle.src})`);
        
        // Preload gambar terlebih dahulu untuk memastikan bisa dimuat dengan benar
        const preloadImg = new Image();
        
        // Tambahkan timeout untuk menghindari hang
        const loadTimeout = setTimeout(() => {
            console.error(`Timeout saat loading gambar: ${randomPuzzle.src}`);
            preloadImg.src = ''; // Cancel loading
            
            // Coba fallback atau gambar lain
            if (imagePool.length > 1) {
                const nextIndex = (randomIndex + 1) % imagePool.length;
                const nextPuzzle = imagePool[nextIndex];
                console.log(`Timeout - coba gambar berikutnya: ${nextPuzzle.name}`);
                
                // Recursive call dengan gambar lain
                const reducedPool = imagePool.filter((_, i) => i !== randomIndex);
                startRandomPuzzle(reducedPool);
            } else {
                createFallbackImage();
            }
        }, 10000); // 10 detik timeout
        
        preloadImg.onload = function() {
            clearTimeout(loadTimeout);
            console.log(`✅ Gambar final ${randomPuzzle.name} berhasil dimuat, memulai game...`);
            
            // Buat versi gambar yang lebih "aman" untuk iPad
            if (isIOS) {
                console.log("Memproses gambar khusus untuk iOS...");
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = preloadImg.width;
                    canvas.height = preloadImg.height;
                    ctx.drawImage(preloadImg, 0, 0);
                    
                    // Konversi ke data URL untuk iOS
                    const safeDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    randomPuzzle.src = safeDataUrl;
                    console.log("Gambar berhasil dikonversi untuk iOS");
                } catch (e) {
                    console.error("Gagal mengkonversi gambar untuk iOS:", e);
                    // Lanjutkan dengan gambar original jika konversi gagal
                }
            }
            
            // Mulai permainan dengan puzzle acak setelah gambar dimuat
            startGame(randomPuzzle);
        };
        
        preloadImg.onerror = function(err) {
            clearTimeout(loadTimeout);
            console.error(`❌ Gagal memuat gambar final: ${randomPuzzle.src}`, err);
            
            // Coba menggunakan gambar default atau gambar lain jika gagal
            if (imagePool.length > 1) {
                console.log("Mencoba gambar lain dari pool...");
                const reducedPool = imagePool.filter((_, i) => i !== randomIndex);
                startRandomPuzzle(reducedPool);
            } else {
                console.error("Tidak ada gambar lain tersedia, menggunakan fallback");
                createFallbackImage();
            }
        };
        
        // Log untuk debugging
        console.log(`🔄 Loading gambar final: ${randomPuzzle.src}`);
        
        // Mulai loading gambar
        preloadImg.src = randomPuzzle.src;
        
        // Untuk iOS, coba force download terlebih dahulu
        if (isIOS) {
            console.log("Force download untuk iOS");
            fetch(randomPuzzle.src)
                .then(response => response.blob())
                .then(blob => {
                    const objectURL = URL.createObjectURL(blob);
                    console.log("Berhasil membuat objectURL:", objectURL);
                    preloadImg.src = objectURL;
                })
                .catch(error => {
                    console.error("Fetch gagal:", error);
                    // Tetap gunakan src original jika fetch gagal
                });
        }
    }
    
    // Event listener untuk tombol "Acak Ulang"
    shuffleButton.addEventListener('click', () => {
        shufflePieces();
    });
    
    // Event listener untuk tombol "Ganti Gambar"
    document.getElementById('change-image-button').addEventListener('click', () => {
        startRandomPuzzle();
    });
    
    // Event listener untuk tombol "Main Lagi"
    playAgainButton.addEventListener('click', () => {
        successModal.classList.add('hidden');
        startRandomPuzzle();
    });
    
    // Event listener untuk perubahan tingkat kesulitan
    difficultySelect.addEventListener('change', () => {
        gridSize = parseInt(difficultySelect.value);
        startRandomPuzzle();
    });
    
    // Preload semua gambar terlebih dahulu, kemudian mulai permainan
    preloadAllImages();
}); 