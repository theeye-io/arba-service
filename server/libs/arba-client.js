'use strict';
const _ = require('lodash');
const request = require('request-promise');
const moment = require('moment');
const fs = require('fs');

const sendCOT = function(cot) {
  return new Promise((resolve, reject) => {
    var filename;
    try {
      filename = toFile(cot);
    } catch (error) {
      return reject(error);
    }

    request.post({
      url: 'http://cot.test.arba.gov.ar/TransporteBienes/SeguridadCliente/presentarRemitos.do',
      formData: {
        user: null,
        password: null,
        file: fs.createReadStream(filename),
      },
    }).then((response) => {
      console.log(response);
    }).catch((error) => {
      console.log(error);
    });

    return resolve(filename);
  });
};

const toFile = function(cot) {
  const header = `01|${cot.cuit_empresa} \n`;
  const body = _.reduce(cot.remitos, (acc, remito) => {
    const productos = _.map(remito.productos, (producto) => {
      return productoToString(producto);
    });
    return acc + remitoToString(remito) + '\n' + productos.join('\n');
  }, '') + '\n';
  const footer = `04|${cot.remitos.length}`;

  const cuit = cot.cuit_empresa;
  const planta = _.pad(cot.numero_planta, 3, '0');
  const puerta = _.pad(cot.numero_puerta, 3, '0');
  const fecha = moment(cot.fecha_emision).format('YYYYMMDD');
  const seq = _.pad(cot.numero_secuencia, 6, '0');

  const fileName = `/tmp/TB_${cuit}_${planta}${puerta}_${fecha}_${seq}.txt`;
  const fileContent = (header + body + footer);
  console.log(fileContent);
  fs.writeFileSync(fileName, fileContent, 'utf8');
  return fileName;
};

const remitoToString = function(r) {
  const parseDate = function(date) {
    return moment(date).format('YYYYMMDD');
  };

  const parseBoolean = function(bool) {
    return bool ? 'SI' : 'NO';
  };

  const remito = {
    fecha_emision: parseDate(r.fecha_emision),
    codigo_unico: [
      r.codigo_unico_dgi,
      ' ' + r.codigo_unico_tipo,
      r.codigo_unico_prefijo,
      r.codigo_unico_numero,
    ].join(''),
    fecha_salida_transporte: parseDate(r.fecha_salida_transporte),
    hora_salida_transporte: r.hora_salida_transporte || ' ',
    sujeto_generador: r.sujeto_generador,
    destinatario_consumidor_final: r.destinatario_consumidor_final,
    destinatario_tipo_documento: r.destinatario_tipo_documento,
    destinatario_documento: r.destinatario_documento,
    destinatario_cuit: r.destinatario_cuit || ' ',
    destinatario_razon_social: r.destinatario_razon_social || ' ',
    destinatario_tenedor: r.destinatario_tenedor,
    destino_domicilio_calle: r.destino_domicilio_calle,
    destino_domicilio_numero: r.destino_domicilio_numero || ' ',
    destino_domicilio_comple: r.destino_domicilio_comple || ' ',
    destino_domicilio_piso: r.destino_domicilio_piso || ' ',
    destino_domicilio_dto: r.destino_domicilio_dto || ' ',
    destino_domicilio_barrio: r.destino_domicilio_barrio || ' ',
    destino_domicilio_codigopostal: r.destino_domicilio_codigopostal,
    destino_domicilio_localidad: r.destino_domicilio_localidad,
    destino_domicilio_provincia: r.destino_domicilio_provincia,
    propio_destino_domicilio_codigo: r.propio_destino_domicilio_codigo || ' ',
    entrega_domicilio_origen: parseBoolean(r.entrega_domicilio_origen),
    origen_cuit: r.origen_cuit,
    origen_razon_social: r.origen_razon_social,
    emisor_tenedor: r.emisor_tenedor,
    origen_domicilio_calle: r.origen_domicilio_calle,
    origen_domicilio_numero: r.origen_domicilio_numero || ' ',
    origen_domicilio_comple: r.origen_domicilio_comple || ' ',
    origen_domicilio_piso: r.origen_domicilio_piso || ' ',
    origen_domicilio_dto: r.origen_domicilio_dto || ' ',
    origen_domicilio_barrio: r.origen_domicilio_barrio || ' ',
    origen_domicilio_codigopostal: r.origen_domicilio_codigopostal,
    origen_domicilio_localidad: r.origen_domicilio_localidad,
    origen_domicilio_provincia: r.origen_domicilio_provincia,
    transportista_cuit: r.transportista_cuit,
    tipo_recorrido: r.tipo_recorrido,
    recorrido_localidad: r.recorrido_localidad || ' ',
    recorrido_calle: r.recorrido_calle || ' ',
    recorrido_ruta: r.recorrido_ruta || ' ',
    patente_vehiculo: r.patente_vehiculo || ' ',
    patente_acoplado: r.patente_acoplado || ' ',
    producto_no_term_dev: r.producto_no_term_dev,
    importe: r.importe,
  };
  return _.reduce(remito, (acc, value) => {
    return acc + '|' + (typeof(value) == 'boolean' ? Number(value) : value);
  }, '02');
};

const productoToString = function(producto) {
  return _.reduce(producto, (acc, value, key) => {
    return acc + '|' + (typeof(value) == 'boolean' ? Number(value) : value);
  }, '03');
};

module.exports = {sendCOT};
