import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, MessageCircle, Users2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-green rounded-2xl flex items-center justify-center mr-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900">FriendZone</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with friends, share your interests, and build meaningful relationships in a friendly, non-romantic environment.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-brand-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Meaningful Connections</h3>
              <p className="text-gray-600">Build lasting friendships based on shared interests and values.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Engage</h3>
              <p className="text-gray-600">Post updates, photos, and engage with your friends' content.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-brand-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Users2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interest Groups</h3>
              <p className="text-gray-600">Join groups based on your hobbies and interests to meet like-minded people.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Connect?</h2>
          <p className="text-lg text-gray-600 mb-8">Join FriendZone today and start building meaningful friendships.</p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-brand-blue text-white px-8 py-3 text-lg rounded-lg font-semibold transition-colors"
          >
            Get Started
          </Button>
        </div>

        {/* Demo Screenshots */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Experience FriendZone</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-brand-blue mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-800">Connect with Friends</h4>
                    <p className="text-gray-600 mt-2">Send and receive friend requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-brand-green mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-800">Share Your World</h4>
                    <p className="text-gray-600 mt-2">Post updates and engage with content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
