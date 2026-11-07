import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

WebBrowser.maybeCompleteAuthSession();

// Etapa 3 · Foro 2: autenticación con Firebase (correo y Google) y pedidos guardados en Firestore.
// Colecciones: usuarios/{uid} -> { nombre, email, rol }   ·   pedidos/{id} -> { clienteId, producto, ..., estado, historial }
const C = { ink: '#482E31', muted: '#8F7378', rose: '#B54C6A', blush: '#FBE5E7', bg: '#FFF9F6', white: '#FFFFFF', border: '#F0DDE0', green: '#438669' };
// Catálogo sincronizado manualmente con src/app/lib/data.js de PostresYa Web (etapa 2).
const INITIAL_PRODUCTS = [
  {id:1,name:'Pastel de Chocolate',kind:'Pasteles',emoji:'🍫',description:'Bizcocho húmedo de chocolate con ganache',price:25},
  {id:2,name:'Pastel Tres Leches',kind:'Pasteles',emoji:'🍰',description:'Clásico pastel tres leches con canela',price:22},
  {id:3,name:'Cupcakes Vainilla',kind:'Cupcakes',emoji:'🧁',description:'Caja de 6 cupcakes de vainilla decorados',price:12},
  {id:4,name:'Cheesecake de Fresa',kind:'Cheesecakes',emoji:'🍓',description:'Cheesecake horneado con cobertura de fresa',price:28},
];
const ESTADOS = ['Pendiente','En preparación','Listo','Entregado'];
// Traduce los códigos de error de Firebase a mensajes que entiende el usuario.
const authError = code => ({
  'auth/invalid-credential':'Correo o contraseña incorrectos.',
  'auth/wrong-password':'Correo o contraseña incorrectos.',
  'auth/user-not-found':'No existe una cuenta con ese correo.',
  'auth/email-already-in-use':'Ya existe una cuenta con ese correo.',
  'auth/invalid-email':'El correo no es válido.',
  'auth/weak-password':'La contraseña es muy débil.',
  'auth/too-many-requests':'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'auth/network-request-failed':'Sin conexión a internet. Revisá tu red.',
  'auth/popup-closed-by-user':'Cerraste la ventana de Google antes de terminar.',
}[code] || 'Ocurrió un error. Intentá de nuevo.');
const fechaHora = ts => ts?.toDate ? ts.toDate().toLocaleString('es-SV') : '';

// Botón de Google para el celular (Android/iOS). Usa expo-auth-session y luego le pasa el token a Firebase.
function GoogleNativeButton({onError}) {
  const [request,response,promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  useEffect(()=>{
    if (response?.type==='success') {
      const cred = GoogleAuthProvider.credential(response.params.id_token);
      signInWithCredential(auth,cred).catch(e=>onError(authError(e.code)));
    } else if (response?.type==='error') onError('No se pudo iniciar sesión con Google.');
  },[response]);
  return <Btn title="Continuar con Google" variant="outline" disabled={!request} onPress={()=>promptAsync()}/>;
}
function GoogleButton({onError}) {
  // En la web, Firebase abre la ventana de Google directamente (sin configuración extra).
  if (Platform.OS==='web') return <Btn title="Continuar con Google" variant="outline" onPress={()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(e=>onError(authError(e.code)))}/>;
  // En el celular hacen falta los Client ID de Google en el archivo .env.
  if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
    return <Btn title="Continuar con Google" variant="outline" onPress={()=>onError('Google en el celular necesita un Client ID de Android. Probalo en la versión web (tecla w en Expo).')}/>;
  return <GoogleNativeButton onError={onError}/>;
}

const emailOK = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const money = n => '$' + n.toFixed(2);
const shortDate = iso => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const nextDateISO = (days = 2) => { const d = new Date(); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

function Btn({title,onPress,variant='primary',disabled=false}) {return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.btn,variant==='outline'&&s.btnOutline,disabled&&{opacity:.5}]}><Text style={[s.btnText,variant==='outline'&&{color:C.rose}]}>{title}</Text></Pressable>}
function Field({label,value,onChangeText,placeholder,secureTextEntry=false,keyboardType='default',autoCapitalize='sentences'}) {return <View style={{marginBottom:14}}><Text style={s.label}>{label}</Text><TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#AD969A" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false}/></View>}
function Header({title,subtitle,onBack}) {return <View style={s.header}>{onBack&&<Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Text style={{color:C.rose,fontWeight:'700'}}>‹ Volver</Text></Pressable>}<Text style={s.h1}>{title}</Text>{subtitle&&<Text style={s.sub}>{subtitle}</Text>}</View>}
function Panel({children,style}) {return <View style={[s.panel,style]}>{children}</View>}

export default function App() {
  const [screen,setScreen] = useState('loading');
  const [user,setUser] = useState(null);
  const [busy,setBusy] = useState(false);
  const [form,setForm] = useState({name:'',email:'',password:'',confirm:''});
  const [error,setError] = useState('');
  const [filter,setFilter] = useState('Todos');
  const [product,setProduct] = useState(INITIAL_PRODUCTS[0]);
  const [size,setSize] = useState('Mediano');
  const [delivery,setDelivery] = useState(nextDateISO(2));
  const [note,setNote] = useState('');
  const [orders,setOrders] = useState([]);
  const go = v => {setError('');setScreen(v)};
  const change = (k,v) => {setForm(f=>({...f,[k]:v}));setError('')};
  // 1) SESIÓN: Firebase avisa cada vez que alguien entra o sale. Aquí decidimos a qué pantalla ir.
  useEffect(()=>onAuthStateChanged(auth, async fbUser=>{
    if (!fbUser) { setUser(null); setOrders([]); setScreen('welcome'); return; }
    try {
      const ref = doc(db,'usuarios',fbUser.uid);
      let snap = await getDoc(ref);
      if (!snap.exists()) { // primera vez (por ejemplo, entró con Google): se crea su perfil como cliente
        await setDoc(ref,{nombre:fbUser.displayName||fbUser.email.split('@')[0],email:fbUser.email,rol:'cliente',creadoEn:serverTimestamp()});
        snap = await getDoc(ref);
      }
      const data = snap.data();
      setUser({uid:fbUser.uid,name:data.nombre,email:data.email,role:data.rol});
      setScreen(data.rol==='admin'?'admin':'home');
    } catch (e) { setError('No se pudo cargar tu perfil.'); setScreen('welcome'); }
  }),[]);

  // 2) PEDIDOS EN TIEMPO REAL: el cliente escucha solo los suyos; la administradora escucha todos.
  useEffect(()=>{
    if (!user) return;
    const ref = collection(db,'pedidos');
    const q = user.role==='admin' ? ref : query(ref, where('clienteId','==',user.uid));
    return onSnapshot(q, snap=>{
      const lista = snap.docs.map(d=>({id:d.id,...d.data()}));
      lista.sort((a,b)=>(b.creadoEn?.seconds||0)-(a.creadoEn?.seconds||0)); // más recientes primero
      setOrders(lista);
    }, ()=>Alert.alert('Error','No se pudieron cargar los pedidos.'));
  },[user]);

  const logout = async () => {await signOut(auth);setForm({name:'',email:'',password:'',confirm:''});};
  const login = async () => {
    if (!emailOK(form.email)) return setError('Ingresá un correo electrónico válido.');
    if (!form.password) return setError('Ingresá tu contraseña.');
    setBusy(true);
    try { await signInWithEmailAndPassword(auth,form.email.trim(),form.password); } // onAuthStateChanged nos lleva a la pantalla correcta
    catch (e) { setError(authError(e.code)); }
    finally { setBusy(false); }
  };
  const register = async () => {
    if (form.name.trim().length<3) return setError('El nombre debe tener al menos 3 caracteres.');
    if (!emailOK(form.email)) return setError('Ingresá un correo válido.');
    if (form.password.length<8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password!==form.confirm) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth,form.email.trim(),form.password);
      await updateProfile(cred.user,{displayName:form.name.trim()});
      // Todo usuario nuevo nace como "cliente". El rol admin se asigna a mano en la consola de Firebase.
      await setDoc(doc(db,'usuarios',cred.user.uid),{nombre:form.name.trim(),email:form.email.trim(),rol:'cliente',creadoEn:serverTimestamp()},{merge:true});
      setUser(u=>u?{...u,name:form.name.trim()}:u);
    } catch (e) { setError(authError(e.code)); }
    finally { setBusy(false); }
  };
  // Multiplicadores provisionales del prototipo móvil; verificar contra la API de la etapa 2.
  const selectedPrice = product.price * ({Pequeño:.8,Mediano:1,Grande:1.4}[size]||1);
  const openProduct=p=>{setProduct(p);setSize('Mediano');setDelivery(nextDateISO(2));setNote('');go('detail')};
  // 3) CREAR PEDIDO: valida la fecha (mínimo 2 días de anticipación) y lo guarda en Firestore con el uid del cliente.
  const placeOrder=async()=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(delivery)) return Alert.alert('Fecha inválida','Usá el formato AAAA-MM-DD.');
    const [y,m,d]=delivery.split('-').map(Number);const dt=new Date(y,m-1,d);
    if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d||delivery<nextDateISO(2)) return Alert.alert('Fecha inválida','Elegí una fecha válida con al menos 2 días de anticipación.');
    if(note.length>200) return Alert.alert('Nota muy larga','Las notas pueden tener máximo 200 caracteres.');
    setBusy(true);
    try {
      await addDoc(collection(db,'pedidos'),{
        clienteId:user.uid, clienteNombre:user.name, clienteEmail:user.email,
        product:product.name, emoji:product.emoji, size, delivery, notes:note.trim(), price:selectedPrice,
        status:'Pendiente', creadoEn:serverTimestamp(),
        historial:[{estado:'Pendiente',fecha:new Date().toISOString()}],
      });
      Alert.alert('¡Pedido registrado!','Tu pedido se guardó en la nube.',[{text:'Ver mis pedidos',onPress:()=>go('orders')}]);
      go('orders');
    } catch (e) { Alert.alert('Error','No se pudo guardar el pedido. Revisá tu conexión.'); }
    finally { setBusy(false); }
  };
  // 4) SEGUIMIENTO: solo la administradora cambia el estado; queda registrado en el historial del pedido.
  const changeStatus=async(o,st)=>{
    if(o.status===st) return;
    try { await updateDoc(doc(db,'pedidos',o.id),{status:st,historial:arrayUnion({estado:st,fecha:new Date().toISOString()})}); }
    catch (e) { Alert.alert('Error','No tenés permiso o no hay conexión.'); }
  };
  const myOrders=orders;
  const orderItem = o=><Panel key={o.id}><View style={s.space}><Text style={s.cardTitle}>{o.emoji} {o.product}</Text><Text style={s.pill}>{o.status}</Text></View><Text style={s.sub}>Tamaño: {o.size} · Entrega: {shortDate(o.delivery)}</Text>{user?.role==='admin'&&<Text style={s.sub}>Cliente: {o.clienteNombre} ({o.clienteEmail})</Text>}{!!o.notes&&<Text style={s.sub}>Notas: {o.notes}</Text>}<Text style={s.sub}>Pedido el: {fechaHora(o.creadoEn)}</Text><Text style={s.price}>{money(o.price)}</Text>{!!o.historial?.length&&<View style={{marginTop:8}}><Text style={s.label}>Historial de estados:</Text>{o.historial.map((h,i)=><Text key={i} style={s.hist}>• {h.estado} — {new Date(h.fecha).toLocaleString('es-SV')}</Text>)}</View>}{user?.role==='admin'&&<View style={{marginTop:10}}><Text style={s.label}>Cambiar estado:</Text><View style={s.chips}>{ESTADOS.map(st=><Pressable key={st} onPress={()=>changeStatus(o,st)} style={[s.chip,o.status===st&&s.chipActive]}><Text style={[s.chipText,o.status===st&&{color:'#fff'}]}>{st}</Text></Pressable>)}</View></View>}</Panel>;
  return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor={C.bg}/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
    {screen==='loading'&&<View style={s.welcome}><ActivityIndicator size="large" color={C.rose}/><Text style={s.hint}>Cargando PostresYa...</Text></View>}
    {screen==='welcome'&&<View style={s.welcome}><View style={s.logo}><Text style={{fontSize:76}}>🧁</Text></View><Text style={s.brand}>PostresYa</Text><Text style={s.tag}>Dulces momentos, hechos para vos.</Text><Text style={s.centerText}>Elegí tu postre favorito y personalizalo en unos pocos pasos.</Text><Btn title="Iniciar sesión" onPress={()=>go('login')}/><Btn title="Crear una cuenta" variant="outline" onPress={()=>go('register')}/><Text style={s.hint}>Versión móvil · Avance 2 · Conectada a Firebase</Text></View>}
    {(screen==='login'||screen==='register')&&<><Header title={screen==='login'?'¡Qué gusto verte!':'Creá tu cuenta'} subtitle={screen==='login'?'Ingresá para seguir disfrutando.':'Registrate y explorá nuestros postres.'} onBack={()=>go('welcome')}/><Panel>{screen==='register'&&<Field label="Nombre completo" value={form.name} onChangeText={v=>change('name',v)} placeholder="Tu nombre"/>}<Field label="Correo electrónico" value={form.email} onChangeText={v=>change('email',v)} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none"/><Field label="Contraseña" value={form.password} onChangeText={v=>change('password',v)} placeholder="Mínimo 8 caracteres" secureTextEntry/>{screen==='register'&&<Field label="Confirmar contraseña" value={form.confirm} onChangeText={v=>change('confirm',v)} placeholder="Repetí tu contraseña" secureTextEntry/>}{!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Btn title={busy?'Un momento...':(screen==='login'?'Entrar':'Registrarme')} disabled={busy} onPress={screen==='login'?login:register}/><Text style={[s.hint,{marginTop:16}]}>o</Text><GoogleButton onError={setError}/><Pressable onPress={()=>go(screen==='login'?'register':'login')}><Text style={s.link}>{screen==='login'?'¿No tenés cuenta? Registrate':'¿Ya tenés cuenta? Iniciá sesión'}</Text></Pressable></Panel></>}
    {screen==='home'&&user&&<><Header title={`¡Hola, ${user.name.split(' ')[0]}! 👋`} subtitle="¿Qué antojo te alegrará el día?"/><Panel style={s.hero}><Text style={{fontSize:32}}>🎂  ✨  🧁</Text><Text style={[s.h2,{marginTop:8}]}>Celebrá cada momento</Text><Text style={s.sub}>Preparados con cariño, personalizados para vos.</Text></Panel><Text style={s.section}>Nuestro catálogo</Text><View style={s.chips}>{['Todos','Pasteles','Cupcakes','Cheesecakes'].map(c=><Pressable key={c} onPress={()=>setFilter(c)} style={[s.chip,filter===c&&s.chipActive]}><Text style={[s.chipText,filter===c&&{color:'#fff'}]}>{c}</Text></Pressable>)}</View>{INITIAL_PRODUCTS.filter(p=>filter==='Todos'||p.kind===filter).map(p=><Pressable key={p.id} onPress={()=>openProduct(p)} style={s.product}><View style={s.productEmoji}><Text style={{fontSize:40}}>{p.emoji}</Text></View><View style={{flex:1}}><Text style={s.cardTitle}>{p.name}</Text><Text style={s.sub}>{p.description}</Text><Text style={s.price}>Desde {money(p.price*.8)}</Text></View><Text style={{color:C.rose,fontSize:25}}>›</Text></Pressable>)}<Btn title="Ver mis pedidos" variant="outline" onPress={()=>go('orders')}/><Btn title="Cerrar sesión" variant="outline" onPress={logout}/></>}
    {screen==='detail'&&<><Header title="Personalizá tu pedido" subtitle="Elegí el tamaño y la fecha de entrega." onBack={()=>go('home')}/><Panel><View style={[s.productEmoji,{alignSelf:'center',height:125,width:125,borderRadius:25}]}><Text style={{fontSize:76}}>{product.emoji}</Text></View><Text style={[s.h2,{textAlign:'center',marginTop:15}]}>{product.name}</Text><Text style={[s.sub,{textAlign:'center',marginBottom:20}]}>{product.description}</Text><Text style={s.label}>Tamaño</Text><View style={s.chips}>{['Pequeño','Mediano','Grande'].map(v=><Pressable key={v} onPress={()=>setSize(v)} style={[s.chip,size===v&&s.chipActive]}><Text style={[s.chipText,size===v&&{color:'#fff'}]}>{v}</Text></Pressable>)}</View><Field label="Fecha de entrega (AAAA-MM-DD)" value={delivery} onChangeText={setDelivery} placeholder="2026-10-20" autoCapitalize="none"/><Field label="Notas para tu pedido (opcional)" value={note} onChangeText={setNote} placeholder="Decoración, dedicatoria..."/><View style={s.space}><Text style={s.cardTitle}>Total estimado</Text><Text style={s.price}>{money(selectedPrice)}</Text></View><Text style={s.hint}>Entrega con al menos 2 días de anticipación. No se procesan pagos.</Text><Btn title={busy?'Guardando...':'Confirmar pedido'} disabled={busy} onPress={placeOrder}/></Panel></>}
    {screen==='orders'&&<><Header title="Mis pedidos" subtitle={`${myOrders.length} pedido(s) guardados en tu cuenta`} onBack={()=>go('home')}/>{myOrders.length?myOrders.map(orderItem):<Panel><Text style={s.cardTitle}>Todavía no tenés pedidos</Text><Text style={s.sub}>Visitá nuestro catálogo para elegir tu primer postre.</Text></Panel>}<Btn title="Explorar catálogo" onPress={()=>go('home')}/></>}
    {screen==='admin'&&user&&<><Header title="Panel administrador" subtitle={`Hola, ${user.name} · gestión de pedidos en tiempo real`}/><View style={s.stats}><Panel style={{flex:1}}><Text style={s.sub}>Pedidos</Text><Text style={s.big}>{orders.length}</Text></Panel><Panel style={{flex:1}}><Text style={s.sub}>Pendientes</Text><Text style={s.big}>{orders.filter(o=>o.status==='Pendiente').length}</Text></Panel></View><View style={s.stats}><Panel style={{flex:1}}><Text style={s.sub}>Entregados</Text><Text style={s.big}>{orders.filter(o=>o.status==='Entregado').length}</Text></Panel><Panel style={{flex:1}}><Text style={s.sub}>Total vendido</Text><Text style={[s.big,{fontSize:24}]}>{money(orders.reduce((t,o)=>t+(o.price||0),0))}</Text></Panel></View><Text style={s.section}>Todos los pedidos</Text>{orders.length?orders.map(orderItem):<Panel><Text style={s.cardTitle}>No hay pedidos todavía</Text><Text style={s.sub}>Cuando un cliente haga un pedido, aparecerá aquí al instante.</Text></Panel>}<Btn title="Cerrar sesión" variant="outline" onPress={logout}/></>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},scroll:{paddingHorizontal:20,paddingTop:Platform.OS==='android'?16:10,paddingBottom:45,flexGrow:1},welcome:{flex:1,justifyContent:'center',paddingVertical:44},logo:{height:145,width:145,borderRadius:74,backgroundColor:C.blush,alignItems:'center',justifyContent:'center',alignSelf:'center',marginBottom:18},brand:{fontSize:43,fontWeight:'900',color:C.rose,textAlign:'center'},tag:{fontSize:17,fontWeight:'600',color:C.ink,textAlign:'center',marginTop:8},centerText:{color:C.muted,textAlign:'center',marginVertical:28,lineHeight:23},h1:{fontSize:29,fontWeight:'800',color:C.ink},h2:{fontSize:22,fontWeight:'800',color:C.ink},sub:{fontSize:14,color:C.muted,lineHeight:22,marginTop:5},header:{marginBottom:20,marginTop:8},back:{paddingVertical:12,alignSelf:'flex-start'},panel:{backgroundColor:C.white,borderRadius:20,borderWidth:1,borderColor:C.border,padding:19,marginBottom:15},btn:{backgroundColor:C.rose,paddingVertical:16,paddingHorizontal:16,borderRadius:13,alignItems:'center',marginTop:13},btnOutline:{borderWidth:1.5,borderColor:C.rose,backgroundColor:C.white},btnText:{color:'#fff',fontSize:16,fontWeight:'800'},input:{borderWidth:1,borderColor:C.border,backgroundColor:'#FFFCFC',borderRadius:11,paddingHorizontal:13,paddingVertical:13,fontSize:15,color:C.ink},label:{color:C.ink,fontWeight:'700',fontSize:13,marginBottom:8},error:{color:'#B42C36',fontSize:13,marginBottom:10},link:{textAlign:'center',color:C.rose,marginTop:18,fontWeight:'700'},hint:{fontSize:12,color:C.muted,marginTop:14,lineHeight:18,textAlign:'center'},hero:{backgroundColor:'#FFECEB'},section:{fontSize:20,color:C.ink,fontWeight:'800',marginTop:12,marginBottom:13},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:17},chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:20,backgroundColor:C.blush,borderColor:C.border,borderWidth:1},chipActive:{backgroundColor:C.rose,borderColor:C.rose},chipText:{fontSize:12,color:C.rose,fontWeight:'700'},product:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:C.white,padding:13,borderWidth:1,borderColor:C.border,borderRadius:17,marginBottom:12},productEmoji:{height:79,width:79,borderRadius:15,backgroundColor:C.blush,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:16,fontWeight:'800',color:C.ink,flexShrink:1},price:{fontSize:18,color:C.rose,fontWeight:'900',marginTop:8},space:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},pill:{backgroundColor:'#EAF4EE',color:C.green,borderRadius:15,paddingHorizontal:9,paddingVertical:5,fontSize:11,fontWeight:'700'},stats:{flexDirection:'row',gap:12},big:{fontSize:32,fontWeight:'900',color:C.rose,marginTop:8},hist:{fontSize:12,color:C.muted,lineHeight:19}});
