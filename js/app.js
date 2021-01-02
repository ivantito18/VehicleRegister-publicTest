/*-----Constantes y Variables-----*/

const listaAutos = document.querySelector("#lista-autos");
const formularioAuto = document.querySelector("#formulario_auto");
const contenedor = document.querySelector("#contenedor");
const formularioContenedor = document.querySelector("#formulario_contenedor");
const inputMarca = document.querySelector("#input_marca");
const inputModelo = document.querySelector("#input_modelo");
const inputAño = document.querySelector("#input_año");
const inputDominio = document.querySelector("#input_dominio");
const footerYear = document.querySelector("#yearFooter");

let DB;
let idAuto;
let flag = false;

/*-------------Clases--------------*/

class Auto {
    constructor(marca, modelo, año, dominio, id){
        this.marca = marca,
        this.modelo = modelo,
        this.año = año,
        this.dominio = dominio,
        this.id = id
    }
};

class UI {
    //Muestra el Auto en pantalla
    imprimirAuto(autoFin){
        const {marca, modelo, año, dominio, id} = autoFin;

        listaAutos.innerHTML += ` 
        <tr>
            <td><p>${marca}</p></td>
            <td><p>${modelo}</p></td>
            <td><p>${año}</p></td>
            <td><p>${dominio}</p></td>
            <td>
                <a href="bdEmpresa.html" data-auto="${id}" class="far fa-trash-alt button-delete eliminar"></a>
            </td>
        </tr>`;
    }

    //imprime Alerta de exito o error en pantalla
    imprimirAlerta(mensaje, tipo){
        const divAlerta = document.createElement("DIV");
        divAlerta.classList.add("alerta2");

        const p = document.createElement("P");
        p.textContent = mensaje;

        if(tipo === "error"){
            p.classList.add("alerta");
            p.classList.remove("success");
        }else{
            p.classList.remove("alerta");
            p.classList.add("success");
        }

        divAlerta.appendChild(p);
        contenedor.insertBefore(divAlerta, formularioContenedor);

        setTimeout(function(){
            divAlerta.remove();
        }, 4000);
    }
};

const ui = new UI();

/*------------Even Listeners-----------*/

document.addEventListener("DOMContentLoaded", ()=>{
    crearDB();
    formularioAuto.addEventListener("submit", crearAuto);
    obtenerAutosDb();
    listaAutos.addEventListener("click", eliminarAuto);
    const parametrosURL = new URLSearchParams(window.location.search);
    idAuto = parametrosURL.get("id");
});


/*----------Funciones--------------*/

function crearDB(){
    
    const connectDB = window.indexedDB.open("crm", 1);


    connectDB.onerror = function(){
        console.log("Hubo un error al crear la BD");
    }

    connectDB.onsuccess = function(){
        console.log("Base de datos Actualizada");
        DB = connectDB.result;
    }

    connectDB.onupgradeneeded = function(e){
        const db = e.target.result;
        const objStore = db.createObjectStore("crm", {keyPath: "id", autoIncrement: true});

        objStore.createIndex("marca", "marca", {unique: false});
        objStore.createIndex("modelo", "modelo", {unique: false});
        objStore.createIndex("año", "año", {unique: false});
        objStore.createIndex("dominio", "dominio", {unique: true});
        objStore.createIndex("id", "id", {unique: true});
    }
}

//Crea el Objeto "auto" que luego se guardará en indexDB y se mostrará en pantalla.
//Se envía a validación.
function crearAuto(e){
    e.preventDefault();
    let marca = inputMarca.value.toUpperCase();
    let año = inputAño.value;
    let modelo = inputModelo.value.toUpperCase();
    let dominio = inputDominio.value.toUpperCase();
    const id = Number(Date.now());

    console.log(marca);

    let auto = new Auto(marca, modelo, año, dominio, id);
    validarAuto(auto);
}

//Valida el Objeto, que este correctamente escrito y que no tenga errores
function validarAuto(autoObj){
    const {marca, modelo, año, dominio, id} = autoObj;
    const date = new Date();
    const year = date.getFullYear();
    let verificado = verificarDominioBD(dominio);

    /*Aquí la variable "verificado" da un error de Undefined, cuando debería dar un booleano,
    por ende no verifica correctamente, aunque la aplicación sigue funcional sin problemas..*/

    //console.log(verificado); Aquí al comprobarla da undefined.
    
    if(marca === "" || modelo === "" || año === "" || dominio === ""){
        ui.imprimirAlerta("Todos los campos son obligatorios", "error");
        return;
    }else if(marca.length < 2 || modelo.length < 2){
        ui.imprimirAlerta("La marca o el modelo son muy cortos", "error");
    }else if(isNaN(año) || año < 1950 || año > year){
       ui.imprimirAlerta("El año debe ser un Número o no es válido", "error");
       return;
    }else if(dominio.length < 6 || dominio.length > 6){
        ui.imprimirAlerta("Formato de Dominio Erróneo", "error");
        return;
    }else{
        ui.imprimirAlerta("Vehículo añadido correctamente", "success");
        guardarAutoDB(autoObj);
        ui.imprimirAuto(autoObj);
        formularioAuto.reset();
    }
}

//Debe verificar si el dominio existe en la base de datos y de existir retornar un True
function verificarDominioBD(dominio){
    const transaction = DB.transaction(["crm"], "readonly");
    const store = transaction.objectStore("crm");
    store.openCursor().onsuccess = function(e){
        const cursor = e.target.result;
        if(cursor){
            if(cursor.value.dominio === dominio){
                flag = true;
                ui.imprimirAlerta("Dominio existente en la Base de Datos. No se guardará.", "error");
                return flag;
            }else{
                cursor.continue();
            }          
        }
    }
}

/*Guarda el Auto en una IndexDB*/
function guardarAutoDB(autoObj){
    const transaction = DB.transaction(["crm"], "readwrite");
    const store = transaction.objectStore("crm");

    store.add(autoObj);

    transaction.onerror = function(){
        console.log("Hubo un error en la carga del vehiculo");
    }

    transaction.oncomplete = function(){
        console.log("Auto agregado a la BD");
    }
}

/*Obtiene el auto guardado en la IndexDB */
function obtenerAutosDb(){
    const conexion = window.indexedDB.open("crm", 1);

    conexion.onerror = function(){
        console.log("hubo un error");
    };

    conexion.onsuccess = function(){
        DB = conexion.result;

        const objectStore = DB.transaction("crm").objectStore("crm");

        objectStore.openCursor().onsuccess = function(e){
            const cursor = e.target.result;

            if(cursor){
                const {marca, modelo, año, dominio, id} = cursor.value;
                const lista = document.querySelector("#lista-autos");
                lista.innerHTML += ` 
                <tr>
                    <td><p>${marca}</p></td>
                    <td><p>${modelo}</p></td>
                    <td><p>${año}</p></td>
                    <td><p>${dominio}</p></td>
                    <td>
                        <a href data-auto="${id}" class="far fa-trash-alt button-delete eliminar"></a>
                    </td>
                </tr>`;

                cursor.continue();
            }else{
                console.log("No hay mas registros");
            }
        }
    }
}

//Elimina el auto de la BD y también de pantalla.
function eliminarAuto(e){
    if(e.target.classList.contains("eliminar")){
        const data = Number(e.target.dataset.auto);
        
        const confirmar = confirm("¿Está seguro que desea eliminar el Vehiculo del sistema?");
        if(confirmar){
            const transaction = DB.transaction(["crm"], "readwrite");
            const store = transaction.objectStore("crm");

            store.delete(data);

            transaction.oncomplete = function(){
                console.log("Auto eliminado de la DB");
            }

            transaction.onerror = function(){
                console.log("Hubo un error");
            }
        }
    }
}