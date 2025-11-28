const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const soloAdmin = require('../middlewares/soloAdmin');

// 🔹 Importamos el controller con exacta coincidencia de mayúsculas/minúsculas
const ctrl = require('../controllers/tablasController');

// ======================================================
// ANUAL
// ======================================================
router.get('/anual', ctrl.obtenerTablaAnual);
router.post('/anual', auth, soloAdmin, ctrl.agregarEquipoAnual);
router.put('/anual/:id', auth, soloAdmin, ctrl.actualizarEquipoAnual);
router.delete('/anual/:id', auth, soloAdmin, ctrl.eliminarEquipoAnual);

// ======================================================
// CLAUSURA
// ======================================================
router.get('/clausura', ctrl.obtenerTablaClausura);
router.post('/clausura', auth, soloAdmin, ctrl.agregarEquipoClausura);
router.put('/clausura/:id', auth, soloAdmin, ctrl.actualizarEquipoClausura);
router.delete('/clausura/:id', auth, soloAdmin, ctrl.eliminarEquipoClausura);

module.exports = router;
