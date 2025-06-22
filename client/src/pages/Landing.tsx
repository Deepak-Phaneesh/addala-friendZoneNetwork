import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, MessageCircle, Users2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <header className="text-center mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center mr-6 shadow-lg">
              <Users className="w-10 h-10 text-brand-accent" />
            </div>
            <h1 className="text-6xl font-bold elegant-text tracking-tight">FriendZone</h1>
          </div>
          <p className="text-2xl elegant-text-soft max-w-3xl mx-auto leading-relaxed">
            Connect with friends, share your passions, and build meaningful relationships in an elegant, welcoming space.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          <Card className="elegant-card text-center p-8 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="pt-8">
              <div className="w-16 h-16 bg-brand-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-2xl font-bold elegant-text mb-4">Meaningful Connections</h3>
              <p className="elegant-text-soft text-lg leading-relaxed">Build lasting friendships based on shared interests and authentic values.</p>
            </CardContent>
          </Card>

          <Card className="elegant-card text-center p-8 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="pt-8">
              <div className="w-16 h-16 bg-brand-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-2xl font-bold elegant-text mb-4">Share & Engage</h3>
              <p className="elegant-text-soft text-lg leading-relaxed">Express yourself through beautiful posts and meaningful conversations.</p>
            </CardContent>
          </Card>

          <Card className="elegant-card text-center p-8 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="pt-8">
              <div className="w-16 h-16 bg-brand-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users2 className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-2xl font-bold elegant-text mb-4">Interest Communities</h3>
              <p className="elegant-text-soft text-lg leading-relaxed">Discover groups that celebrate your passions and interests.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold elegant-text mb-6">Ready to Connect?</h2>
          <p className="text-xl elegant-text-soft mb-10 max-w-2xl mx-auto leading-relaxed">Join FriendZone today and start building meaningful, authentic relationships.</p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="elegant-button px-12 py-4 text-xl rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Begin Your Journey
          </Button>
        </div>

        {/* Experience Preview */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center elegant-text mb-12">Experience FriendZone</h3>
          <div className="grid md:grid-cols-2 gap-10">
            <Card className="elegant-card overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-brand-primary-soft to-brand-primary-light p-12 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-20 h-20 text-brand-accent mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                    <h4 className="text-2xl font-bold elegant-text mb-3">Connect with Friends</h4>
                    <p className="elegant-text-soft text-lg">Build your circle with meaningful connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="elegant-card overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-brand-primary-soft to-brand-primary-light p-12 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 text-brand-accent mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                    <h4 className="text-2xl font-bold elegant-text mb-3">Share Your Story</h4>
                    <p className="elegant-text-soft text-lg">Express yourself through beautiful moments</p>
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
