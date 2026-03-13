fetch("data/productos_destacados.json")
    .then(res => res.json())
    .then(productos => {
        const contenedor = document.getElementById("productos-destacados");
        contenedor.innerHTML = productos.map(producto => `
            <div class="col-md-4 mb-4">
                <div class="card">

                    <!-- Imagen de fondo + icono -->
                    <div class="card-img-area" style="
                        background: url('${producto.imagen}') center/cover;
                        height: 200px;
                        position: relative;
                    ">
                        <div class="card-overlay"></div>

                        <i class="service-icon ${producto.icono}" 
                           style="position: absolute; 
                                  top: 50%; 
                                  left: 50%; 
                                  transform: translate(-50%, -50%);
                                  color: white;">
                        </i>
                    </div>

                    <!-- Contenido -->
                    <div class="card-body text-center">
                        <h5>${producto.titulo}</h5>
                        <p>${producto.descripcion}</p>

                        <a href="${producto.enlace}" class="btn btn-primary w-100">
                            <i class="fas fa-arrow-right me-2"></i>Ver más
                        </a>
                    </div>
                </div>
            </div>
        `).join("");
    });
