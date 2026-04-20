import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Image, FlatList, Dimensions, StatusBar, ScrollView,
  ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const THEME = {
  primary: '#2E1F1B', accent: '#D9B99B', card: '#3E2411', textMain: '#FFFFFF', textDim: '#E0D5CC'
};

const CATEGORIES = ["All", "Rings", "Necklaces", "Watches", "Earrings", "Bracelets"];

export default function JewelryNoirApp() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');

  // Payment States
  const [paymentStep, setPaymentStep] = useState(0); // 0: Details, 1: Number, 2: Success
  const [phoneNo, setPhoneNo] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    fetchProducts();
    loadCartFromStorage();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const fetchProducts = async () => {
    try {
      let response = await fetch('http://192.168.0.104/leohub_api/get_products.php');
      let data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert("Connection Error", "Check XAMPP or IP!");
    }
  };

  const loadCartFromStorage = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('@jewelry_noir_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) { console.log(e); }
  };

  const addToCart = async (product) => {
    const newCart = [...cart, product];
    setCart(newCart);
    await AsyncStorage.setItem('@jewelry_noir_cart', JSON.stringify(newCart));
    showToast();
  };

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 60, duration: 500, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: -100, duration: 500, useNativeDriver: true })
    ]).start();
  };

  // --- Sub-Pages / Payment Views ---

  const PaymentSuccess = () => (
    <View style={styles.successContainer}>
      <AntDesign name="checkcircle" size={80} color={THEME.accent} />
      <Text style={styles.successTitle}>PAYMENT SUCCESSFUL</Text>
      <Text style={styles.successSub}>Aapka order process ho chuka hai.</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={() => { setSelectedProduct(null); setPaymentStep(0); }}>
        <Text style={styles.closeBtnText}>BACK TO SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  const ProductDetails = ({ product }) => (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image_url }} style={styles.detailImg} />
          <TouchableOpacity style={styles.backFab} onPress={() => { setSelectedProduct(null); setPaymentStep(0); }}>
            <AntDesign name="close" size={24} color={THEME.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContent}>
          {paymentStep === 0 && (
            <>
              <Text style={styles.detailCat}>{product.category.toUpperCase()}</Text>
              <Text style={styles.detailTitle}>{product.name}</Text>
              <Text style={styles.detailPrice}>PKR {product.price}</Text>
              <View style={styles.divider} />
              <Text style={styles.descHeading}>DESIGNER'S NOTE</Text>
              <Text style={styles.descText}>{product.description}</Text>

              <Text style={[styles.descHeading, { marginTop: 20 }]}>SELECT PAYMENT METHOD</Text>
              <View style={styles.paymentRow}>
                {['EasyPaisa', 'JazzCash', 'Visa'].map(m => (
                  <TouchableOpacity key={m} style={styles.payOption} onPress={() => setPaymentStep(1)}>
                    <Text style={styles.payText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {paymentStep === 1 && (
            <View style={styles.inputArea}>
              <Text style={styles.detailTitle}>Enter Account Details</Text>
              <TextInput
                style={styles.input}
                placeholder="03XX-XXXXXXX"
                placeholderTextColor={THEME.textDim}
                keyboardType="numeric"
                onChangeText={setPhoneNo}
              />
              <TouchableOpacity style={styles.submitBtn} onPress={() => setPaymentStep(2)}>
                <Text style={styles.submitBtnText}>CONFIRM PAYMENT</Text>
              </TouchableOpacity>
            </View>
          )}

          {paymentStep === 2 && <PaymentSuccess />}
          <View style={{ height: 150 }} />
        </View>
      </ScrollView>

      {paymentStep === 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addBagBtn} onPress={() => addToCart(product)}>
            <Text style={styles.addBagText}>COLLECT PIECE</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor: THEME.primary }]}><ActivityIndicator size="large" color={THEME.accent} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}><Text style={styles.toastText}>Added to Collection!</Text></Animated.View>

      {selectedProduct ? (
        <ProductDetails product={selectedProduct} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.header}>
              <View><Text style={styles.welcomeText}>Luxury by</Text><Text style={styles.brandTitle}>JEWELRY NOIR</Text></View>
              <TouchableOpacity style={styles.cartBtnHeader}><Feather name="shopping-bag" size={22} color={THEME.accent} /><View style={styles.badge}><Text style={styles.badgeText}>{cart.length}</Text></View></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 25, marginBottom: 15 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => { setSelectedCategory(cat); setFilteredProducts(cat === "All" ? products : products.filter(p => p.category === cat)); }} style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}>
                  <Text style={[styles.catBtnText, selectedCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filteredProducts}
              numColumns={2}
              scrollEnabled={false}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => { setSelectedProduct(item); slideAnim.setValue(height); Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start(); }}>
                  <View style={styles.imageBorderBox}><Image source={{ uri: item.image_url }} style={styles.cardImg} /></View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPrice}>Rs. {item.price}</Text>
                </TouchableOpacity>
              )}
            />
          </ScrollView>

          {/* Workable Bottom Navigation */}
          <View style={styles.navBar}>
            {[
              { name: 'Home', icon: 'home-outline' },
              { name: 'Collection', icon: 'diamond-outline' },
              { name: 'Cart', icon: 'cart-outline' },
              { name: 'Profile', icon: 'person-outline' }
            ].map(tab => (
              <TouchableOpacity key={tab.name} style={styles.navItem} onPress={() => setActiveTab(tab.name)}>
                <Ionicons name={tab.icon} size={24} color={activeTab === tab.name ? THEME.accent : THEME.textDim} />
                <Text style={[styles.navText, { color: activeTab === tab.name ? THEME.accent : THEME.textDim }]}>{tab.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  welcomeText: { color: THEME.textDim, fontSize: 14 },
  brandTitle: { color: THEME.accent, fontSize: 26, fontWeight: 'bold' },
  cartBtnHeader: { backgroundColor: THEME.card, padding: 12, borderRadius: 15 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: THEME.accent, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: THEME.primary, fontSize: 10, fontWeight: 'bold' },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginRight: 10, backgroundColor: THEME.card },
  catBtnActive: { backgroundColor: THEME.accent },
  catBtnText: { color: THEME.accent },
  catBtnTextActive: { color: THEME.primary },
  card: { flex: 0.5, margin: 10 },
  imageBorderBox: { borderWidth: 3, borderColor: THEME.accent, borderRadius: 20, overflow: 'hidden' },
  cardImg: { width: '100%', height: 170 },
  cardName: { color: THEME.textMain, marginTop: 10, fontSize: 15 },
  cardPrice: { color: THEME.accent, fontWeight: 'bold' },
  imageContainer: { width: width, height: height * 0.5 },
  detailImg: { width: '100%', height: '100%' },
  backFab: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 50 },
  detailsContent: { backgroundColor: THEME.primary, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, padding: 30 },
  detailTitle: { color: THEME.textMain, fontSize: 28, fontWeight: 'bold' },
  detailPrice: { color: THEME.accent, fontSize: 22, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#4A3328', marginVertical: 20 },
  descText: { color: THEME.textDim, lineHeight: 22 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  payOption: { backgroundColor: THEME.card, padding: 15, borderRadius: 12, width: '30%', alignItems: 'center', borderWidth: 1, borderColor: THEME.accent },
  payText: { color: THEME.accent, fontSize: 12, fontWeight: 'bold' },
  inputArea: { marginTop: 20 },
  input: { backgroundColor: THEME.card, borderRadius: 15, padding: 20, color: THEME.textMain, marginTop: 15, borderWidth: 1, borderColor: THEME.accent },
  submitBtn: { backgroundColor: THEME.accent, padding: 20, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  submitBtnText: { color: THEME.primary, fontWeight: 'bold' },
  successContainer: { alignItems: 'center', marginTop: 50 },
  successTitle: { color: THEME.accent, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  successSub: { color: THEME.textDim, marginTop: 10 },
  closeBtn: { marginTop: 30, padding: 15, borderBottomWidth: 1, borderBottomColor: THEME.accent },
  closeBtnText: { color: THEME.accent, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, width: width, padding: 25, backgroundColor: THEME.primary },
  addBagBtn: { backgroundColor: THEME.accent, padding: 20, borderRadius: 20, alignItems: 'center' },
  addBagText: { color: THEME.primary, fontWeight: 'bold' },
  navBar: { position: 'absolute', bottom: 0, width: width, height: 80, backgroundColor: THEME.card, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#4A3328' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, marginTop: 4 },
  toast: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: THEME.accent, padding: 15, borderRadius: 15, alignItems: 'center', zIndex: 1000 },
  toastText: { color: THEME.primary, fontWeight: 'bold' }
});