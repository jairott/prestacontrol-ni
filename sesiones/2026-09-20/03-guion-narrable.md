# Guion narrable — 2026-09-20
## Jack ya sabe qué traila busca el cliente antes de preguntarle

Hoy resolvimos algo que llevaba tiempo pasando desapercibido en el sistema de Jack, el agente de ventas de TraiMax por WhatsApp.

Cuando alguien le da clic a uno de nuestros anuncios de Facebook o Instagram que dicen "Chatea con nosotros", ese anuncio ya le está mostrando una foto de un tipo específico de traila — una dump, una enclosed, una gooseneck. El cliente clickeó ESA foto porque ESA es la que le interesa. Pero cuando le escribía a Jack, Jack igual le preguntaba "¿qué tipo de traila estás buscando?" — como si no supiéramos nada. Eso se siente mal para el cliente, y nos hace parecer menos atentos de lo que en realidad somos.

Lo curioso es que, al meterme al código, encontré que el sistema SÍ estaba recibiendo esa información — GHL manda, pegado al mensaje del cliente, un pedacito de texto con el nombre del anuncio y el link de origen. Pero el código que teníamos solo usaba ese pedacito para una cosa: borrarlo, para que el cliente no viera esa basura técnica en el chat. La información llegaba... y la tirábamos a la basura. Ese es el tipo de bug que no rompe nada visiblemente, pero te está costando ventas todos los días sin que te des cuenta.

Así que fui a revisar nuestra cuenta de anuncios en Meta. Ahí confirmé que tenemos tres campañas corriendo ahora mismo — una para dump, una para enclosed, y una para gooseneck de 40 pies — con once anuncios en total repartidos entre las tres. Y encontré algo clave: dentro de la información del contacto que GHL ya nos manda, viene el ID real del anuncio exacto que la persona clickeó. Ese dato ya estaba disponible, solo que nadie lo estaba usando.

Con eso armé una tablita simple: "este ID de anuncio es Dump, este otro es Enclosed, este otro es Gooseneck". Y modifiqué el flujo para que, apenas alguien escribe desde uno de esos anuncios, Jack reciba una nota interna que dice: "este cliente ya sabemos que quiere una traila tipo X — no se lo preguntes, salúdalo confirmándoselo y pasa directo a preguntarle la medida".

Antes de subirlo a producción, hice tres cosas para no arriesgar nada: primero, probé la lógica por separado con datos de ejemplo para confirmar que funcionaba bien tanto cuando SÍ hay anuncio como cuando NO lo hay (una conversación normal no debía verse afectada). Segundo, comparé exactamente qué cambiaba en el workflow antes de publicarlo, para asegurarme de que solo toqué las dos piezas que quería tocar y nada más. Y solo después de esas dos verificaciones lo publiqué.

Una cosa importante para el futuro: esa tablita de "qué anuncio es qué traila" hay que actualizarla a mano cada vez que lancemos una campaña nueva para otro tipo de traila — car hauler, flatbed, equipment, utility, roll-off. Si se nos olvida agregarlo, no pasa nada malo: Jack simplemente vuelve a preguntar el tipo, como hacía antes, solo para esos anuncios nuevos que todavía no están en la lista.

Esto es un buen ejemplo para el curso: no siempre el problema es que falte una función — a veces la información ya está ahí, solo hay que ir a buscarla, entender de dónde viene realmente, y conectarla en el lugar correcto.
