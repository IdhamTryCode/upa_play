// Logika untuk game Jigsaw Puzzle
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Deteksi apakah perangkat mobile
    const isMobile = window.innerWidth <= 600;
    
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
            draggedPiece.offsetX = e.touches[0].clientX - rect.left;
            draggedPiece.offsetY = e.touches[0].clientY - rect.top;
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
        
        // Dapatkan posisi relatif terhadap halaman
        const puzzleBoardRect = puzzleBoard.getBoundingClientRect();
        const refContainerRect = referenceContainer.getBoundingClientRect();
        
        // Update posisi berdasarkan posisi mouse/touch relatif terhadap viewport
        draggedPiece.element.style.position = 'absolute';
        draggedPiece.element.style.left = `${clientX - draggedPiece.offsetX - document.body.scrollLeft}px`;
        draggedPiece.element.style.top = `${clientY - draggedPiece.offsetY - document.body.scrollTop}px`;
        
        // Pastikan element masih di dalam document.body
        if (draggedPiece.element.parentNode !== document.body) {
            document.body.appendChild(draggedPiece.element);
        }
    }
    
    // Fungsi untuk mengakhiri drag
    function endDrag(e) {
        if (!draggedPiece) return;
        
        // Hilangkan kelas dragging
        draggedPiece.element.classList.remove('dragging');
        draggedPiece.element.classList.remove('magnet-active');
        
        // Kembalikan position ke absolute
        draggedPiece.element.style.position = 'absolute';
        
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
                const touch = e.changedTouches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
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
                    
                    // Animasi ke posisi yang tepat
                    draggedPiece.element.style.transition = 'left 0.3s ease, top 0.3s ease';
                    draggedPiece.element.style.left = `${draggedPiece.correctX}px`;
                    draggedPiece.element.style.top = `${draggedPiece.correctY}px`;
                    draggedPiece.currentX = draggedPiece.correctX;
                    draggedPiece.currentY = draggedPiece.correctY;
                    
                    // Tambahkan efek visual
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
            // Tambahkan efek visual untuk kembali (tanpa animasi rumit)
            draggedPiece.element.classList.add('returning');
            
            // Kembalikan ke puzzleBoard
            puzzleBoard.appendChild(draggedPiece.element);
            
            // Gunakan transisi yang lebih sederhana
            draggedPiece.element.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
            draggedPiece.element.style.left = `${draggedPiece.originalBoardX}px`;
            draggedPiece.element.style.top = `${draggedPiece.originalBoardY}px`;
            draggedPiece.currentX = draggedPiece.originalBoardX;
            draggedPiece.currentY = draggedPiece.originalBoardY;
            draggedPiece.element.style.zIndex = '1';
            draggedPiece.isPlaced = false;
            
            // Hapus class dan transisi setelah selesai untuk performa
            setTimeout(() => {
                draggedPiece.element.classList.remove('returning');
                draggedPiece.element.style.transition = 'none';
            }, 300); // Waktu yang lebih pendek
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
    
    // Mulai permainan dengan gambar acak ketika halaman dimuat
    function startRandomPuzzle() {
        // Pilih puzzle acak dari daftar gambar
        const randomIndex = Math.floor(Math.random() * puzzleImages.length);
        const randomPuzzle = puzzleImages[randomIndex];
        
        // Mulai permainan dengan puzzle acak
        startGame(randomPuzzle);
    }
    
    // Event listener untuk tombol "Acak Ulang"
    shuffleButton.addEventListener('click', () => {
        shufflePieces();
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
    
    // Fungsi utilitas untuk mencegah scrolling saat drag di mobile
    document.body.addEventListener('touchmove', function(e) {
        if (draggedPiece) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Mulai permainan dengan gambar acak saat halaman dimuat
    startRandomPuzzle();
}); 