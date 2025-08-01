"use server";
import { Account, Avatars, Client, Databases,Storage } from 'node-appwrite';
import { appwriteConfig } from '@/lib/appwrite/config';
import { cookies } from 'next/headers';
// Create a client-side session client that doesn't return complex objects
export const createSessionClient = async () => {
    const session = (await cookies()).get('appwrite_session');
    if (!session || !session.value) 
        throw new Error('No session found');
    
    // Check if this is a custom session (database-only auth)
    if (session.value.startsWith('custom_')) {
        const userData = (await cookies()).get('user_data');
        if (!userData || !userData.value) {
            throw new Error('No user data found for custom session');
        }
        
        const user = JSON.parse(userData.value);
        
        // Return only plain objects and functions that work with client components
        return {
            account: {
                get: async () => user,
                deleteSession: async () => {
                    // This will be handled by a separate server action
                    throw new Error('Use signOutUser server action instead');
                }
            }
        };
    }
    
    // For standard Appwrite sessions, we need to create the client properly
    const client = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setSession(session.value);

    const account = new Account(client);
    
    return {
        account: {
            get: async () => {
                const userData = await account.get();
                // Return only plain object data, not the account instance
                return {
                    $id: userData.$id,
                    email: userData.email,
                    name: userData.name,
                    $createdAt: userData.$createdAt,
                    emailVerification: userData.emailVerification
                };
            },
            deleteSession: async () => {
                await account.deleteSession('current');
            }
        }
    };
}

export const createAdminClient = async ()=>{
    // Validate configuration before creating client
    if (!appwriteConfig.endpointUrl || !appwriteConfig.projectId || !appwriteConfig.secretKey) {
        throw new Error('Missing required Appwrite configuration. Please check your environment variables.');
    }
    
    const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

    return{
        get account(){
            return new Account(client);
        },
        get databases(){
            return new Databases(client);
        },
        get storage(){
            return new Storage(client)
        },
        get avatars(){
            return new Avatars(client);
        },
    }
}