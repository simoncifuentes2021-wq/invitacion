const fs = require('node:fs');
const path = require('node:path');

function readGuests() {
  const filePath = path.join(process.cwd(), 'data', 'invitados.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.invitados) ? parsed.invitados : [];
}

module.exports = (req, res) => {
  const { id } = req.query || {};

  if (!id) {
    res.status(400).json({ error: 'Falta el parametro id' });
    return;
  }

  try {
    const guests = readGuests();
    const guest = guests.find(item => item.id === id);

    if (!guest) {
      res.status(404).json({ error: 'Invitado no encontrado' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      tituloPortada: guest.tituloPortada,
      nombrePortada: guest.nombrePortada,
      saludoHero: guest.saludoHero,
      mensajeHero: guest.mensajeHero,
      cantidadPases: guest.cantidadPases,
      whatsappNombre: guest.whatsappNombre || guest.nombrePortada
    });
  } catch (error) {
    res.status(500).json({ error: 'No fue posible cargar el invitado' });
  }
};
