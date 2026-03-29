import multer from 'multer';
import path from 'path';

// složka pro nahrané obrázky
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unikátní název
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Pouze obrázky jsou povoleny!'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 20*1024*1024 } }); // max 20MB