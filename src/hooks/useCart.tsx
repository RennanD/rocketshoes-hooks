import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart =localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const existentProduct = cart.find(product => product.id === productId);
      
      const currentAmmoun = existentProduct ? existentProduct.amount : 0;
      const response = await api.get(`/stock/${productId}`)
      const { stock } = response.data
      const amount = currentAmmoun + 1;

      if(amount > stock) {
        throw new Error()
      }

      
      if(existentProduct) {
        updateProductAmount({ productId: existentProduct.id, amount })
      } else {
        const { data } = await api.get(`/products/${productId}`);
        setCart([ ...cart, {
         ...data,
         amount: 1 
        }])

        localStorage.setItem(
          '@RocketShoes:cart', 
          JSON.stringify([...cart, {
            ...data,
            amount: 1 
           }])
        );
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findedProduct = cart.some(product => product.id === productId )

      if(!findedProduct) {
        throw new Error()
      }
      const filterProducts = cart.filter(product => product.id !== productId)
    
      setCart(filterProducts)
      localStorage.setItem(
        '@RocketShoes:cart', 
        JSON.stringify(filterProducts)
      )

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findedProduct = cart.some(product => product.id === productId )

      console.log(findedProduct)

      if(!findedProduct) {
        throw new Error('Erro na alteração de quantidade do produto')
      }

      if(amount <= 0) {
        throw new Error();
      }
      const response = await api.get(`/stock/${productId}`)

      const stock: Stock = response.data

      if(amount > stock.amount) {
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const updatedCart = cart.map(product => {
        if(product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product;
      })
      setCart(updatedCart)
      localStorage.setItem(
        '@RocketShoes:cart', 
        JSON.stringify(updatedCart)
      )
    } catch (err) {
      toast.error(err.message)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
