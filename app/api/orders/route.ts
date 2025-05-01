import { createSessionClient } from "@/appwrite/appwrite.config";
import { cookies } from "next/headers";

export async function GET() {
    const sessionCookie = (await cookies()).get("session");

    try {
        const { databases } = await createSessionClient(sessionCookie?.value);
        
        const { documents: orders, total } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID as string,
            process.env.NEXT_PUBLIC_COLLECTION_FLEET as string
        );
        
        return Response.json({ orders, total });
    } catch (error) {
        console.error("ERROR", error);
      
        return Response.json("Access DENIED!", {
            status: 403,
        });
    }
}

